'use strict'
/**
 * 设备路由: 列表 / 批量添加 / 删除 / 转移归属 / 修改分组 / 固件升级 / 绑定解绑 / 导出
 */
const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

const db = require('../db')
const { transaction } = db
const config = require('../config')
const auth = require('../middleware/auth')
const { ok, fail, pageParams, isMobile, isImei, logOperation, exportFilename } = require('../utils/helpers')

/**
 * 设备列表
 * query: imei / mobile / iccid / hadr / group_id / page / size
 * - 普通用户仅能看到自己的设备
 * - 管理员可查看全部, 并可条件搜索
 */
router.get('/', auth, (req, res) => {
  const { imei, mobile, iccid, hadr, groupId, groupName } = req.query
  const { page, size, offset } = pageParams(req.query)
  const where = []
  const params = []
  if (req.user.role !== 1) {
    where.push('d.user_id = ?')
    params.push(req.user.id)
  }
  if (imei) { where.push('d.imei LIKE ?'); params.push(`%${imei}%`) }
  if (iccid) { where.push('d.iccid LIKE ?'); params.push(`%${iccid}%`) }
  if (hadr) { where.push('d.hadr LIKE ?'); params.push(`%${hadr}%`) }
  if (mobile) {
    where.push('(u.mobile LIKE ? OR u.username LIKE ?)')
    params.push(`%${mobile}%`, `%${mobile}%`)
  }
  if (groupId) { where.push('d.group_id = ?'); params.push(groupId) }
  if (groupName) { where.push('g.group_name LIKE ?'); params.push(`%${groupName}%`) }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db.prepare(`
    SELECT COUNT(*) AS c FROM devices d
    LEFT JOIN users u ON u.id = d.user_id
    LEFT JOIN groups g ON g.id = d.group_id
    ${whereSql}
  `).get(...params).c

  const items = db.prepare(`
    SELECT d.id, d.imei, d.iccid, d.hadr, d.ver, d.csq, d.pwrmod, d.online_time,
           d.update_status, d.group_id, d.user_id, d.created_at,
           u.mobile AS user_mobile, u.username AS user_username,
           g.group_name, g.is_default AS group_is_default
    FROM devices d
    LEFT JOIN users u ON u.id = d.user_id
    LEFT JOIN groups g ON g.id = d.group_id
    ${whereSql}
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, size, offset)

  // 组织前端所需嵌套结构: { user: {mobile}, group: {group_name} }
  const list = items.map(d => ({
    ...d,
    user: d.user_id ? { mobile: d.user_mobile, username: d.user_username } : null,
    group: d.group_id ? { group_name: d.group_name, is_default: d.group_is_default } : null
  }))
  ok(res, { total, items: list })
})

/**
 * 批量添加设备
 * body: { list: "imei1\nimei2", phone? }
 * - 普通用户每次最多 20 台; 管理员不限
 * - phone 可选: 设备直接转移到该手机号账户下
 */
router.post('/', auth, (req, res) => {
  const { list, phone } = req.body || {}
  if (!list) return fail(res, '请输入要添加的设备的IMEI')
  const imeis = [...new Set(String(list).split('\n').map(s => s.trim()).filter(Boolean))]
  if (imeis.length === 0) return fail(res, '请输入要添加的设备的IMEI')
  if (req.user.role !== 1 && imeis.length > 20) return fail(res, '每次最多只能添加20只设备')
  if (phone && !isMobile(phone)) return fail(res, '转移手机号码格式不正确')

  // 目标用户
  let targetUserId = req.user.id
  if (phone) {
    const target = db.prepare('SELECT id FROM users WHERE mobile = ?').get(phone)
    if (!target) return fail(res, '转移手机号码对应的用户不存在')
    targetUserId = target.id
  }
  // 默认分组
  const defaultGroup = db.prepare('SELECT id FROM groups WHERE is_default = 1').get()

  const insert = db.prepare(
    'INSERT INTO devices (imei, group_id, user_id) VALUES (?, ?, ?)'
  )

  const results = { added: 0, exists: [], invalid: [] }
  transaction(() => {
    for (const imei of imeis) {
      if (!isImei(imei)) { results.invalid.push(imei); continue }
      const dup = db.prepare('SELECT id FROM devices WHERE imei = ?').get(imei)
      if (dup) { results.exists.push(imei); continue }
      insert.run(imei, defaultGroup ? defaultGroup.id : null, targetUserId)
      results.added++
    }
  })
  logOperation(db, req.user.id, 'device.create', 'device', null, { imeis, phone }, req.ip)
  ok(res, results, `添加成功 ${results.added} 台`)
})

/** 删除设备 */
router.delete('/:id', auth, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
  if (!device) return fail(res, '设备不存在')
  if (req.user.role !== 1 && device.user_id !== req.user.id) return fail(res, '无权操作此设备')
  db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id)
  logOperation(db, req.user.id, 'device.delete', 'device', device.id, { imei: device.imei }, req.ip)
  ok(res, null, '删除成功')
})

/** 批量转移设备归属 */
router.post('/transfer', auth, (req, res) => {
  const { phone, imeis } = req.body || {}
  if (!isMobile(phone)) return fail(res, '请输入正确的手机号码')
  const target = db.prepare('SELECT id FROM users WHERE mobile = ?').get(phone)
  if (!target) return fail(res, '该手机号用户不存在')
  const list = String(imeis).split('\n').map(s => s.trim()).filter(Boolean)
  if (list.length === 0) return fail(res, '设备IMEI不能为空')

  let count = 0
  transaction(() => {
    for (const imei of list) {
      const device = db.prepare('SELECT * FROM devices WHERE imei = ?').get(imei)
      if (!device) continue
      if (req.user.role !== 1 && device.user_id !== req.user.id) continue
      db.prepare('UPDATE devices SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(target.id, device.id)
      count++
    }
  })
  logOperation(db, req.user.id, 'device.transfer', 'device', null, { phone, count }, req.ip)
  ok(res, { count }, `转移成功 ${count} 台`)
})

/** 修改设备分组 */
router.post('/changeDeviceGroup', auth, (req, res) => {
  const { deviceId, groupId } = req.body || {}
  if (!deviceId) return fail(res, '参数错误')
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId)
  if (!device) return fail(res, '设备不存在')
  if (req.user.role !== 1 && device.user_id !== req.user.id) return fail(res, '无权操作此设备')
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId)
  if (!group) return fail(res, '分组不存在')
  db.prepare('UPDATE devices SET group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(groupId, deviceId)
  logOperation(db, req.user.id, 'device.changeGroup', 'device', deviceId, { groupId, imei: device.imei }, req.ip)
  ok(res, null, '修改成功')
})

/** 固件升级 */
router.post('/updateDeviceSys', auth, (req, res) => {
  const { deviceIds, version } = req.body || {}
  if (!Array.isArray(deviceIds) || deviceIds.length === 0) return fail(res, '请选择要升级的设备')
  const list = deviceIds.filter(Boolean)
  const upd = db.prepare(
    "UPDATE devices SET update_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  )
  transaction(() => {
    for (const id of list) {
      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id)
      if (!device) continue
      if (req.user.role !== 1 && device.user_id !== req.user.id) continue
      upd.run(`升级中 ${version || 'latest'}`, id)
    }
  })
  ok(res, null, '升级任务已下发')
})

/** 未绑定用户设备列表 (admin) */
router.get('/notbind', auth, (req, res) => {
  const { page, size, offset } = pageParams(req.query)
  const total = db.prepare('SELECT COUNT(*) AS c FROM devices WHERE user_id IS NULL').get().c
  const items = db.prepare(`
    SELECT * FROM devices WHERE user_id IS NULL ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(size, offset)
  ok(res, { total, items })
})

/** 绑定设备到用户 */
router.post('/bind/:id', auth, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
  if (!device) return fail(res, '设备不存在')
  db.prepare('UPDATE devices SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(req.user.id, device.id)
  logOperation(db, req.user.id, 'device.bind', 'device', device.id, null, req.ip)
  ok(res, null, '绑定成功')
})

/** 解绑设备 */
router.post('/unbind/:id', auth, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
  if (!device) return fail(res, '设备不存在')
  if (req.user.role !== 1 && device.user_id !== req.user.id) return fail(res, '无权操作此设备')
  db.prepare('UPDATE devices SET user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(device.id)
  logOperation(db, req.user.id, 'device.unbind', 'device', device.id, null, req.ip)
  ok(res, null, '解绑成功')
})

/** 导出设备列表 (CSV) */
router.post('/exportDeviceList', auth, (req, res) => {
  const query = req.body || {}
  const { imei, mobile, iccid, hadr, groupId } = query
  const where = []
  const params = []
  if (req.user.role !== 1) { where.push('d.user_id = ?'); params.push(req.user.id) }
  if (imei) { where.push('d.imei LIKE ?'); params.push(`%${imei}%`) }
  if (iccid) { where.push('d.iccid LIKE ?'); params.push(`%${iccid}%`) }
  if (hadr) { where.push('d.hadr LIKE ?'); params.push(`%${hadr}%`) }
  if (mobile) { where.push('(u.mobile LIKE ? OR u.username LIKE ?)'); params.push(`%${mobile}%`, `%${mobile}%`) }
  if (groupId) { where.push('d.group_id = ?'); params.push(groupId) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rows = db.prepare(`
    SELECT d.imei, d.iccid, d.hadr, d.ver, d.csq, d.online_time, d.created_at,
           u.mobile AS user_mobile, g.group_name
    FROM devices d
    LEFT JOIN users u ON u.id = d.user_id
    LEFT JOIN groups g ON g.id = d.group_id
    ${whereSql} ORDER BY d.id DESC
  `).all(...params)

  const header = ['IMEI', 'ICCID', '硬件版本', '固件版本', '信号', '最近上线', '所属账号', '分组', '创建时间']
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([r.imei, r.iccid, r.hadr, r.ver, r.csq, r.online_time || '', r.user_mobile || '', r.group_name || '', r.created_at || ''].map(esc).join(','))
  }
  const filename = exportFilename('deviceList')
  const filePath = path.join(config.exportDir, filename)
  fs.writeFileSync(filePath, '﻿' + lines.join('\r\n'), 'utf8')
  logOperation(db, req.user.id, 'device.export', 'device', null, { count: rows.length }, req.ip)
  ok(res, { file: `/static/export/${filename}`, filename })
})

module.exports = router

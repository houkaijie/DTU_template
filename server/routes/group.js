'use strict'
/**
 * 分组路由: 列表 / 详情(含config) / 创建 / 更新 / 删除 / 复制 / 分配设备
 */
const express = require('express')
const router = express.Router()

const db = require('../db')
const { transaction } = db
const auth = require('../middleware/auth')
const { ok, fail, pageParams, logOperation } = require('../utils/helpers')

/** 分组列表 (含设备数量) */
router.get('/', auth, (req, res) => {
  const { groupName } = req.query
  const { page, size, offset } = pageParams(req.query)
  let where = '1=1'
  const params = []
  if (groupName) { where += ' AND g.group_name LIKE ?'; params.push(`%${groupName}%`) }
  // 普通用户仅可见自己创建的 + 默认分组
  if (req.user.role !== 1) {
    where += ' AND (g.user_id = ? OR g.is_default = 1)'
    params.push(req.user.id)
  }
  const total = db.prepare(`SELECT COUNT(*) AS c FROM groups g WHERE ${where}`).get(...params).c
  const items = db.prepare(`
    SELECT g.id, g.group_name, g.is_default, g.created_at,
           (SELECT COUNT(*) FROM devices d WHERE d.group_id = g.id) AS devices_count
    FROM groups g WHERE ${where}
    ORDER BY g.id ASC LIMIT ? OFFSET ?
  `).all(...params, size, offset)
  ok(res, { total, items })
})

/** 分组详情 (含 config JSON) */
router.get('/:id', auth, (req, res) => {
  const group = db.prepare(`
    SELECT g.*, (SELECT COUNT(*) FROM devices d WHERE d.group_id = g.id) AS devices_count
    FROM groups g WHERE g.id = ?
  `).get(req.params.id)
  if (!group) return fail(res, '分组不存在')
  if (req.user.role !== 1 && group.user_id !== req.user.id && group.is_default !== 1) {
    return fail(res, '无权访问此分组')
  }
  ok(res, group)
})

/** 创建分组 */
router.post('/', auth, (req, res) => {
  const { groupName } = req.body || {}
  if (!groupName || !groupName.trim()) return fail(res, '分组名称不能为空')
  const info = db.prepare('INSERT INTO groups (group_name, user_id) VALUES (?, ?)')
    .run(groupName.trim(), req.user.id)
  logOperation(db, req.user.id, 'group.create', 'group', info.lastInsertRowid, { groupName }, req.ip)
  ok(res, { id: info.lastInsertRowid }, '保存成功')
})

/** 更新分组 (含 config 配置下发) */
router.put('/:id', auth, (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id)
  if (!group) return fail(res, '分组不存在')
  if (req.user.role !== 1 && group.user_id !== req.user.id && group.is_default !== 1) {
    return fail(res, '无权操作此分组')
  }
  const { groupName, config } = req.body || {}
  const newName = groupName && groupName.trim() ? groupName.trim() : group.group_name
  let newConfig = group.config
  if (config !== undefined) {
    // 校验 JSON 合法性, 非法则拒绝 (防止脏数据下发到设备)
    try {
      JSON.parse(config)
      newConfig = config
    } catch (e) {
      return fail(res, '配置数据格式错误')
    }
  }
  db.prepare('UPDATE groups SET group_name = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newName, newConfig, group.id)
  logOperation(db, req.user.id, 'group.update', 'group', group.id, { groupName: newName, configUpdated: config !== undefined }, req.ip)
  ok(res, null, '更新成功')
})

/** 删除分组 (默认分组不可删除) */
router.delete('/:id', auth, (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id)
  if (!group) return fail(res, '分组不存在')
  if (group.is_default === 1) return fail(res, '默认分组不可删除')
  if (req.user.role !== 1 && group.user_id !== req.user.id) return fail(res, '无权操作此分组')
  // 组内设备回退到默认分组
  const defaultGroup = db.prepare('SELECT id FROM groups WHERE is_default = 1').get()
  db.prepare('UPDATE devices SET group_id = ? WHERE group_id = ?')
    .run(defaultGroup ? defaultGroup.id : null, group.id)
  db.prepare('DELETE FROM groups WHERE id = ?').run(group.id)
  logOperation(db, req.user.id, 'group.delete', 'group', group.id, { groupName: group.group_name }, req.ip)
  ok(res, null, '删除成功')
})

/** 复制分组 (复制名称 + 配置) */
router.post('/copy/:id', auth, (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id)
  if (!group) return fail(res, '分组不存在')
  if (req.user.role !== 1 && group.user_id !== req.user.id && group.is_default !== 1) {
    return fail(res, '无权操作此分组')
  }
  const { groupName } = req.body || {}
  if (!groupName || !groupName.trim()) return fail(res, '请输入新分组名称')
  const info = db.prepare('INSERT INTO groups (group_name, config, user_id) VALUES (?, ?, ?)')
    .run(groupName.trim(), group.config, req.user.id)
  logOperation(db, req.user.id, 'group.copy', 'group', info.lastInsertRowid, { fromGroup: group.id }, req.ip)
  ok(res, { id: info.lastInsertRowid }, '复制成功')
})

/** 分配设备到分组 (批量) */
router.post('/setDeviceList', auth, (req, res) => {
  const { groupId, deviceIds } = req.body || {}
  if (!groupId || !Array.isArray(deviceIds)) return fail(res, '参数错误')
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId)
  if (!group) return fail(res, '分组不存在')
  if (req.user.role !== 1 && group.user_id !== req.user.id && group.is_default !== 1) {
    return fail(res, '无权操作此分组')
  }
  const upd = db.prepare('UPDATE devices SET group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
  transaction(() => {
    for (const id of deviceIds.filter(Boolean)) {
      const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id)
      if (!device) continue
      if (req.user.role !== 1 && device.user_id !== req.user.id) continue
      upd.run(groupId, id)
    }
  })
  logOperation(db, req.user.id, 'group.assignDevices', 'group', groupId, { count: deviceIds.length }, req.ip)
  ok(res, null, '分配成功')
})

module.exports = router

'use strict'
/**
 * IoT 设备接入路由 (供 DTU 设备固件调用, 无需前端鉴权)
 *
 * 设备接入流程:
 *   1. 设备上电 → POST /iot/api/register 注册 (绑定 IMEI)
 *   2. 注册成功后 → GET /iot/api/config/:imei 拉取所属分组的参数配置
 *   3. 运行中 → GET /iot/api/heartbeat 周期性心跳 (更新在线状态/信号/流量)
 *   4. 业务数据 → POST /iot/api/report 上报采集数据
 */
const express = require('express')
const router = express.Router()

const db = require('../db')
const { ok, fail, pageParams, isImei } = require('../utils/helpers')

/**
 * 设备注册
 * body: { imei, iccid?, hadr?, ver? }
 * - IMEI 已存在 → 更新设备信息并返回分组配置
 * - IMEI 不存在 → 创建设备 (归属默认分组, 未绑定用户)
 */
router.post('/register', (req, res) => {
  const { imei, iccid, hadr, ver } = req.body || {}
  if (!isImei(imei)) return fail(res, 'IMEI 格式错误')

  let device = db.prepare('SELECT * FROM devices WHERE imei = ?').get(imei)
  if (!device) {
    const defaultGroup = db.prepare('SELECT id FROM groups WHERE is_default = 1').get()
    const info = db.prepare(
      'INSERT INTO devices (imei, iccid, hadr, ver, group_id) VALUES (?, ?, ?, ?, ?)'
    ).run(imei, iccid || '', hadr || '', ver || '', defaultGroup ? defaultGroup.id : null)
    device = db.prepare('SELECT * FROM devices WHERE id = ?').get(info.lastInsertRowid)
  } else {
    db.prepare('UPDATE devices SET iccid = COALESCE(?, iccid), hadr = COALESCE(?, hadr), ver = COALESCE(?, ver), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(iccid || null, hadr || null, ver || null, device.id)
  }

  const group = db.prepare('SELECT config FROM groups WHERE id = ?').get(device.group_id)
  ok(res, {
    deviceId: device.id,
    imei: device.imei,
    groupId: device.group_id,
    config: group ? JSON.parse(group.config || '{}') : {}
  }, '注册成功')
})

/**
 * 心跳上报
 * query: imei, csq?, iccid?, hadr?, ver?, flow_used?
 * 更新设备在线时间/信号/版本, 写入心跳流水 (流量查询数据源)
 */
router.get('/heartbeat', (req, res) => {
  const { imei, csq, iccid, hadr, ver, flow_used } = req.query
  const device = db.prepare('SELECT * FROM devices WHERE imei = ?').get(imei)
  if (!device) {
    // 未注册设备自动注册 (物联网卡即插即用)
    const defaultGroup = db.prepare('SELECT id FROM groups WHERE is_default = 1').get()
    const info = db.prepare(
      'INSERT INTO devices (imei, iccid, hadr, ver, group_id) VALUES (?, ?, ?, ?, ?)'
    ).run(imei, iccid || '', hadr || '', ver || '', defaultGroup ? defaultGroup.id : null)
    device = db.prepare('SELECT * FROM devices WHERE id = ?').get(info.lastInsertRowid)
  }

  db.prepare(`
    UPDATE devices SET
      csq = COALESCE(?, csq),
      iccid = COALESCE(?, iccid),
      hadr = COALESCE(?, hadr),
      ver = COALESCE(?, ver),
      online_time = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(csq || null, iccid || null, hadr || null, ver || null,
    new Date().toISOString(), device.id)

  db.prepare(`
    INSERT INTO device_heartbeats (device_id, imei, csq, hadr, iccid, ver, flow_used, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(device.id, imei, csq || '', hadr || '', iccid || '', ver || '',
    parseInt(flow_used, 10) || 0, req.ip)

  ok(res, { deviceId: device.id, time: new Date().toISOString() })
})

/**
 * 业务数据上报 (透传到云平台桥接服务)
 * body: { imei, type, data }
 */
router.post('/report', (req, res) => {
  const { imei, type, data } = req.body || {}
  const device = db.prepare('SELECT * FROM devices WHERE imei = ?').get(imei)
  if (!device) return fail(res, '设备未注册')

  // 转发到 MQTT 桥接服务 (按设备分组配置分发到对应云平台)
  const bridge = require('../services/mqtt-bridge')
  bridge.forward(device, { type: type || 'report', data, at: Date.now() })

  ok(res, null, '上报成功')
})

/**
 * 设备拉取配置 (返回分组 config JSON)
 */
router.get('/config/:imei', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE imei = ?').get(req.params.imei)
  if (!device) return fail(res, '设备未注册', 40401)
  const group = db.prepare('SELECT config FROM groups WHERE id = ?').get(device.group_id)
  ok(res, {
    imei: device.imei,
    groupId: device.group_id,
    param_ver: group ? JSON.parse(group.config || '{}').param_ver || 0 : 0,
    config: group ? JSON.parse(group.config || '{}') : {}
  })
})

/**
 * 流量查询 (前端页面 /flowSearch)
 * query: imei?, mobile?, page, size
 * 返回设备最近心跳记录 (含信号/版本/在线时间)
 */
router.get('/flowSearch', (req, res) => {
  const { imei, mobile } = req.query
  const { page, size, offset } = pageParams(req.query)
  const where = []
  const params = []
  if (imei) { where.push('d.imei LIKE ?'); params.push(`%${imei}%`) }
  if (mobile) { where.push('(u.mobile LIKE ? OR u.username LIKE ?)'); params.push(`%${mobile}%`, `%${mobile}%`) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const total = db.prepare(`SELECT COUNT(*) AS c FROM devices d LEFT JOIN users u ON u.id = d.user_id ${whereSql}`).get(...params).c
  const items = db.prepare(`
    SELECT d.id, d.imei, d.csq, d.hadr, d.iccid, d.ver, d.online_time, d.created_at,
           u.mobile AS user_mobile, g.group_name
    FROM devices d
    LEFT JOIN users u ON u.id = d.user_id
    LEFT JOIN groups g ON g.id = d.group_id
    ${whereSql}
    ORDER BY d.online_time IS NULL, d.online_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, size, offset)
  ok(res, { total, items })
})

module.exports = router

'use strict'
/**
 * 认证路由: 图形验证码 / 注册 / 登录 / 用户信息 / 修改密码 / 短信验证码
 */
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const svgCaptcha = require('svg-captcha')
const { v4: uuidv4 } = require('uuid')

const db = require('../db')
const config = require('../config')
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')
const { ok, fail, isMobile, logOperation } = require('../utils/helpers')

// ---------- 图形验证码 ----------
router.get('/verify', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1il',
    noise: 2,
    color: true,
    background: '#f0f4ff'
  })
  const uuid = uuidv4().replace(/-/g, '')
  const expiredAt = new Date(Date.now() + config.captchaExpire * 1000)
  db.prepare('INSERT INTO captcha_sessions (uuid, code, expired_at) VALUES (?, ?, ?)')
    .run(uuid, captcha.text.toLowerCase(), expiredAt.toISOString())
  // 返回 data URI 格式, 前端可直接 <img :src> 显示
  const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(captcha.data).toString('base64')
  ok(res, { uuid, captcha: dataUri })
})

// 校验验证码并删除 (一次性)
function verifyCaptcha(uuid, code) {
  if (!uuid || !code) return false
  const row = db.prepare('SELECT code, expired_at FROM captcha_sessions WHERE uuid = ?').get(uuid)
  if (!row) return false
  db.prepare('DELETE FROM captcha_sessions WHERE uuid = ?').run(uuid)
  if (new Date(row.expired_at).getTime() < Date.now()) return false
  return row.code === String(code).trim().toLowerCase()
}

// ---------- 注册 ----------
router.post('/user/register', (req, res) => {
  const { username, mobile, password, code, uuid } = req.body || {}
  if (!isMobile(mobile)) return fail(res, '请输入正确的手机号码')
  if (!password || password.length < 6) return fail(res, '密码长度不能小于6位')
  if (!username) return fail(res, '用户名不能为空')
  if (!verifyCaptcha(uuid, code)) return fail(res, '验证码错误或已过期')

  const exists = db.prepare('SELECT id FROM users WHERE mobile = ?').get(mobile)
  if (exists) return fail(res, '该手机号已注册')

  const info = db.prepare('INSERT INTO users (username, mobile, password, role) VALUES (?, ?, ?, 0)')
    .run(username.trim(), mobile, password)
  logOperation(db, info.lastInsertRowid, 'user.register', 'user', info.lastInsertRowid, { mobile }, req.ip)
  ok(res, { id: info.lastInsertRowid, username, mobile }, '注册成功')
})

// ---------- 登录 ----------
router.post('/user/login', (req, res) => {
  const { mobile, password, code, uuid } = req.body || {}
  if (!verifyCaptcha(uuid, code)) return fail(res, '验证码错误或已过期')

  const user = db.prepare('SELECT * FROM users WHERE mobile = ? AND password = ?').get(mobile, password)
  if (!user) return fail(res, '手机号码或密码错误')

  const token = jwt.sign(
    { id: user.id, mobile: user.mobile, role: user.role, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )
  logOperation(db, user.id, 'user.login', 'user', user.id, null, req.ip)
  ok(res, { token })
})

// ---------- 退出登录 ----------
// JWT 无状态, 这里只做兜底记录; 客户端负责清除本地 token
// 不挂 auth 中间件: token 已过期/失效时也应能正常退出
router.post('/user/logout', (req, res) => {
  if (req.headers['x-token']) {
    try {
      const payload = jwt.verify(req.headers['x-token'], config.jwtSecret)
      logOperation(db, payload.id, 'user.logout', 'user', payload.id, null, req.ip)
    } catch (e) {
      // token 无效则忽略, 仍返回成功
    }
  }
  ok(res, null, '退出成功')
})

// ---------- 获取用户信息 ----------
router.get('/user/info', auth, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, mobile, role, avatar, created_at FROM users WHERE id = ?'
  ).get(req.user.id)
  if (!user) return fail(res, '用户不存在', 50008)
  // 附加设备数量统计
  const devCount = db.prepare('SELECT COUNT(*) AS c FROM devices WHERE user_id = ?').get(user.id).c
  ok(res, { ...user, deviceCount: devCount })
})

// ---------- 修改密码 ----------
router.post('/user/changePwd', auth, (req, res) => {
  const { oldPwd, newPwd } = req.body || {}
  if (!newPwd || newPwd.length < 6) return fail(res, '新密码长度不能小于6位')
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user || user.password !== oldPwd) return fail(res, '原密码不正确')
  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newPwd, req.user.id)
  logOperation(db, req.user.id, 'user.changePwd', 'user', req.user.id, null, req.ip)
  ok(res, null, '密码修改成功')
})

// ---------- 发送短信验证码 (模拟, 生产接阿里云SMS/腾讯云SMS) ----------
router.get('/user/sendCode/:mobile', (req, res) => {
  const { mobile } = req.params
  if (!isMobile(mobile)) return fail(res, '请输入正确的手机号码')
  const code = String(Math.floor(1000 + Math.random() * 9000))
  // 模拟发送, 存内存并打印日志
  req.app.locals.smsCodes = req.app.locals.smsCodes || {}
  req.app.locals.smsCodes[mobile] = { code, expiredAt: Date.now() + 5 * 60 * 1000 }
  console.log(`[SMS-模拟] 发送到 ${mobile}: 验证码 ${code}`)
  ok(res, null, '验证码已发送')
})

// ---------- 仪表盘统计 ----------
router.get('/dashboard/stats', auth, (req, res) => {
  const isAdmin = req.user.role === 1
  const where = isAdmin ? '' : ' WHERE user_id = ?'
  const andWhere = isAdmin ? ' WHERE ' : ' AND '
  const params = isAdmin ? [] : [req.user.id]
  const deviceTotal = db.prepare(`SELECT COUNT(*) AS c FROM devices ${where}`).get(...params).c
  const onlineTotal = db.prepare(`SELECT COUNT(*) AS c FROM devices ${where}${andWhere}online_time IS NOT NULL AND online_time > datetime('now', '-120 seconds')`).get(...params).c
  const groupTotal = db.prepare(
    isAdmin
      ? 'SELECT COUNT(*) AS c FROM groups'
      : 'SELECT COUNT(*) AS c FROM groups WHERE user_id = ? OR is_default = 1'
  ).get(...params).c
  const todayHeartbeat = db.prepare(`
    SELECT COUNT(*) AS c FROM device_heartbeats h
    ${isAdmin ? '' : 'JOIN devices d ON d.id = h.device_id AND d.user_id = ?'}
    WHERE h.created_at > datetime('now', '-1 day')
  `).get(...params).c
  // 最近7天心跳趋势
  const trend = db.prepare(`
    SELECT date(created_at) AS day, COUNT(*) AS cnt
    FROM device_heartbeats h
    ${isAdmin ? '' : 'JOIN devices d ON d.id = h.device_id AND d.user_id = ?'}
    WHERE h.created_at > datetime('now', '-6 day')
    GROUP BY date(created_at) ORDER BY day
  `).all(...params)
  // 最近上线设备
  const recent = db.prepare(`
    SELECT d.id, d.imei, d.csq, d.ver, d.online_time, g.group_name
    FROM devices d LEFT JOIN groups g ON g.id = d.group_id
    ${where}
    ORDER BY d.online_time IS NULL, d.online_time DESC LIMIT 10
  `).all(...params)
  ok(res, {
    deviceTotal,
    onlineTotal,
    offlineTotal: deviceTotal - onlineTotal,
    groupTotal,
    todayHeartbeat,
    trend,
    recent
  })
})

// ---------- 用户列表 (admin) ----------
router.get('/user/list', auth, admin, (req, res) => {
  const { mobile } = req.query
  const { page, size, offset } = require('../utils/helpers').pageParams(req.query)
  let where = '1=1'
  const params = []
  if (mobile) { where += ' AND mobile LIKE ?'; params.push(`%${mobile}%`) }
  const total = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE ${where}`).get(...params).c
  const items = db.prepare(`
    SELECT u.id, u.username, u.mobile, u.role, u.created_at,
           (SELECT COUNT(*) FROM devices d WHERE d.user_id = u.id) AS deviceCount
    FROM users u WHERE ${where}
    ORDER BY u.id DESC LIMIT ? OFFSET ?
  `).all(...params, size, offset)
  ok(res, { total, items })
})

// ---------- 修改角色 (admin) ----------
router.put('/user/changeRole', auth, admin, (req, res) => {
  const { uId, role } = req.body || {}
  if (!uId || ![0, 1].includes(role)) return fail(res, '参数错误')
  if (uId === req.user.id) return fail(res, '不能修改自己的角色')
  db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, uId)
  logOperation(db, req.user.id, 'user.changeRole', 'user', uId, { role }, req.ip)
  ok(res, null, '角色修改成功')
})

module.exports = router

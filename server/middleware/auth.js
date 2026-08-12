'use strict'
/**
 * 认证中间件: 解析 X-Token / Authorization Bearer JWT
 */
const jwt = require('jsonwebtoken')
const config = require('../config')

module.exports = function auth(req, res, next) {
  const token = req.headers['x-token'] ||
    (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''))
  if (!token) {
    return res.json({ code: 50008, message: '未登录或登录已过期' })
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.user = payload
    next()
  } catch (e) {
    return res.json({ code: 50008, message: '登录已过期, 请重新登录' })
  }
}

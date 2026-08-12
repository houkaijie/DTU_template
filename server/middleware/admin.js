'use strict'
/**
 * 管理员权限中间件 (role=1)
 */
module.exports = function admin(req, res, next) {
  if (!req.user || req.user.role !== 1) {
    return res.json({ code: 40300, message: '无权限访问, 需要超级管理员' })
  }
  next()
}

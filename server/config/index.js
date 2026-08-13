'use strict'
/**
 * DTU配置平台 - 全局配置
 * 开发环境使用 SQLite；生产环境可切换 MySQL（见 schema.sql 兼容说明）
 */
const path = require('path')

module.exports = {
  // 服务端口
  port: 3001,

  // JWT
  jwtSecret: 'dtu-platform-secret-key-2026',
  jwtExpiresIn: '7d',

  // 数据库 (SQLite)
  dbPath: path.join(__dirname, '../data/dtu.db'),

  // 图形验证码有效期(秒)
  captchaExpire: 300,

  // 设备心跳离线判定(秒)
  deviceOfflineSeconds: 120,

  // 文件上传/导出目录
  exportDir: path.join(__dirname, '../data/export'),

  // 流量查询 — 公司云平台接入配置 (接口确定后填入 baseUrl/apiKey, 自动从本地模拟切换为真实数据)
  flowApi: {
    baseUrl: '',  // 例如: 'https://api.company.com/iot/flow' (TODO: 待公司云平台确定)
    apiKey: '',   // 云平台分配的密钥
    timeout: 10000
  }
}

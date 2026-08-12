'use strict'
/**
 * DTU配置平台 - 后端服务入口
 * 启动: node app.js  (端口 3001)
 */
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const config = require('./config')
const db = require('./db')

const app = express()

app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

// 导出文件静态访问
app.use('/static/export', express.static(config.exportDir, { fallthrough: false }))

// 路由挂载
app.use('/api', require('./routes/auth'))       // 认证/用户
app.use('/api/device', require('./routes/device')) // 设备
app.use('/api/group', require('./routes/group'))  // 分组
app.use('/iot/api', require('./routes/iot'))     // IoT 设备接入

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 20000, message: 'DTU配置平台后端服务运行中', data: { time: new Date().toISOString() } })
})

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ code: 40400, message: '接口不存在: ' + req.method + ' ' + req.path })
})

// 错误兜底
app.use((err, req, res, next) => {
  console.error('[server error]', err)
  res.status(500).json({ code: 50000, message: err.message || '服务器内部错误' })
})

app.listen(config.port, () => {
  console.log('==========================================')
  console.log('  DTU配置平台 后端服务已启动')
  console.log(`  地址: http://localhost:${config.port}`)
  console.log(`  管理接口: /api/*  IoT接入: /iot/api/*`)
  console.log('  默认管理员: 13800000000 / admin123')
  console.log('==========================================')
})

module.exports = app

'use strict'
/**
 * 数据库初始化: SQLite 连接 + 自动建表 + 种子数据
 */
const fs = require('fs')
const path = require('path')
// 使用 Node 内置 SQLite (Node >= 22.5), 避免原生模块编译
// 生产环境切换 MySQL 时, 将本文件替换为 mysql2 连接即可, 业务代码不变
const { DatabaseSync } = require('node:sqlite')
const config = require('../config')

// 确保数据目录存在
fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })
fs.mkdirSync(config.exportDir, { recursive: true })

const db = new DatabaseSync(config.dbPath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

// 执行建表脚本
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
db.exec(schema)

// ---------- 种子数据 ----------

// 默认管理员: 手机号 13800000000 / 密码 admin123
const seedAdmin = db.prepare('SELECT COUNT(*) AS c FROM users').get()
if (seedAdmin.c === 0) {
  db.prepare(
    "INSERT INTO users (username, mobile, password, role) VALUES (?, ?, ?, ?)"
  ).run('超级管理员', '13800000000', 'admin123', 1)
}

// 默认分组 (is_default=1, 不可删除/改名)
const seedGroup = db.prepare('SELECT COUNT(*) AS c FROM groups').get()
if (seedGroup.c === 0) {
  db.prepare(
    "INSERT INTO groups (group_name, config, is_default) VALUES ('默认分组', ?, 1)"
  ).run(JSON.stringify({
    passon: 1, plate: 0, convert: 0, reg: 1, param_ver: 25, flow: 0, fota: 1,
    uartReadTime: 25, pwrmod: 'normal', password: '', netReadTime: 0, nolog: 0,
    CycleTim: 1400, UartTim: 12000, ServerTim: 6600, webProtect: '1', source: 'web',
    uconf: [[1, '9600', 8, 2, 0, 'pio24', '3000'], [2, '9600', 8, 2, 0, 'pio24', '3000']],
    conf: [[], [], [], [], [], []],
    cmds: [[], []],
    upprot: ['', ''], dwprot: ['', '']
  }))
}

// 示例设备
const seedDevice = db.prepare('SELECT COUNT(*) AS c FROM devices').get()
if (seedDevice.c === 0) {
  const defaultGroup = db.prepare('SELECT id FROM groups WHERE is_default = 1').get()
  const admin = db.prepare('SELECT id FROM users WHERE role = 1').get()
  const insert = db.prepare(
    'INSERT INTO devices (imei, iccid, hadr, ver, csq, group_id, user_id, online_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  insert.run('868120239012345', '89860319745231234567', 'V1.2', 'v1.3.5', '28', defaultGroup.id, admin.id, new Date().toISOString())
  insert.run('868120239012346', '89860319745231234568', 'V1.2', 'v1.3.5', '0', defaultGroup.id, admin.id, null)
  insert.run('868120239012347', '', 'V1.1', 'v1.3.2', '0', defaultGroup.id, admin.id, null)
}

/** 事务辅助函数 (node:sqlite 无 .transaction, 手动 BEGIN/COMMIT) */
function transaction(fn) {
  db.exec('BEGIN')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

module.exports = db
module.exports.transaction = transaction

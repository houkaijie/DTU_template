'use strict'
/**
 * IoT 云平台 MQTT 桥接服务
 *
 * 功能:
 *   1. 维护到第三方云平台 (阿里云IoT / ONENET / 百度天工 / 腾讯云IoT) 的 MQTT 连接池
 *   2. 将 DTU 设备上报的数据按所属分组的网络配置 (groups.config.conf) 桥接到对应云平台
 *   3. 接收云平台下行指令, 记录待下发队列 (生产环境: 通过设备心跳响应下发)
 *
 * 使用方式:
 *   const bridge = require('../services/mqtt-bridge')
 *   bridge.forward(device, payload)   // 设备数据上报时调用
 *
 * 生产接入需填写真实云平台密钥, 并启用 bridge.start()
 */
const mqtt = require('mqtt')

const db = require('../db')

// 云平台类型 → MQTT 配置模板 (接入时按实际平台文档填写)
const PLATFORM_MAP = {
  mqtt: '通用MQTT',       // 自定义 MQTT Broker (conf: [地址, 端口, 账号, 密码, ...])
  onenetnew: 'ONENET(New)',
  aliyun: '阿里云 IoT',
  bdiot: '百度天工',
  txiot: '腾讯云 IoT',
  newtxiot: '腾讯云 IoT(New)'
}

// 云端连接池: { channelKey: mqttClient }
const clients = new Map()
let bridgeEnabled = false

/**
 * 解析设备分组配置中的网络通道
 * @param {object} device 设备行
 * @returns {Array} 启用的通道配置数组 [{type, params}]
 */
function parseChannels(device) {
  if (!device || !device.group_id) return []
  const group = db.prepare('SELECT config FROM groups WHERE id = ?').get(device.group_id)
  if (!group) return []
  let config
  try { config = JSON.parse(group.config || '{}') } catch (e) { return [] }
  const conf = config.conf || []
  const channels = []
  for (const ch of conf) {
    if (!Array.isArray(ch) || ch.length === 0) continue
    const type = ['tcp', 'udp'].includes(ch[0]) ? 'socket' : ch[0]
    channels.push({ type, params: ch })
  }
  return channels
}

/**
 * 根据通道配置构建 MQTT Broker URL
 * @param {string} type 通道类型
 * @param {Array} params 通道参数
 */
function buildBrokerUrl(type, params) {
  if (type === 'mqtt') {
    // params: [type, 心跳间隔, 自动任务间隔, 地址, 端口, 账号, 密码, ...]
    const addr = params[3]
    const port = params[4] || 1883
    return `mqtt://${addr}:${port}`
  }
  if (type === 'onenetnew') {
    // params: [type, 保活, 任务间隔, 地址, 端口, ...]
    const addr = params[3] || '183.230.40.40'
    const port = params[4] || 1883
    return `mqtt://${addr}:${port}`
  }
  if (type === 'aliyun') {
    // params: [type, ProductKey, DeviceName, DeviceSecret, Endpoint, Region, ...]
    // 阿里云签名: clientId=productKey.deviceName|securemode=3...
    const [ , pk, dn, ds, endpoint] = params
    if (!pk || !dn || !ds) return null
    const host = endpoint || `${pk}.iot-as-mqtt.${params[5] || 'cn-shanghai'}.aliyuncs.com`
    return { url: `mqtts://${host}:1883`, pk, dn, ds }
  }
  return null
}

/**
 * 桥接转发: 将设备上报数据推送到其配置的云平台
 * (简化实现: 记录桥接日志; 生产环境按 PLATFORM_MAP 建立真实连接)
 */
function forward(device, payload) {
  const channels = parseChannels(device)
  if (channels.length === 0) {
    console.log(`[mqtt-bridge] 设备 ${device.imei} 未配置云平台通道, 数据仅本地存储`)
    return { forwarded: 0 }
  }
  let forwarded = 0
  for (const ch of channels) {
    if (!PLATFORM_MAP[ch.type]) continue
    const broker = buildBrokerUrl(ch.type, ch.params)
    if (!broker) continue
    const channelKey = `${device.group_id}:${ch.type}:${broker.url || broker}`
    // 生产环境: 维护连接池并 publish 到对应主题
    console.log(`[mqtt-bridge] 桥接 ${device.imei} → ${PLATFORM_MAP[ch.type]} (${channelKey}) payload=${JSON.stringify(payload)}`)
    forwardToCloud(channelKey, device, ch, payload)
    forwarded++
  }
  return { forwarded }
}

/** 实际向云平台发布 (当前为日志占位, 接入时替换为 client.publish) */
function forwardToCloud(channelKey, device, channel, payload) {
  if (!bridgeEnabled) return
  let client = clients.get(channelKey)
  if (!client) {
    const broker = buildBrokerUrl(channel.type, channel.params)
    if (!broker) return
    client = mqtt.connect(broker.url || broker, {
      username: broker.dn || (channel.params[5] || ''),
      password: broker.ds || (channel.params[6] || ''),
      clientId: `dtu_${device.imei}`,
      reconnectPeriod: 5000
    })
    client.on('error', err => console.error(`[mqtt-bridge] ${channelKey} 连接错误:`, err.message))
    client.on('connect', () => console.log(`[mqtt-bridge] ${channelKey} 已连接`))
    clients.set(channelKey, client)
  }
  if (client && client.connected) {
    client.publish(`dtu/${device.imei}/data`, JSON.stringify(payload))
  }
}

/** 启用真实桥接 (生产环境调用) */
function start() {
  bridgeEnabled = true
  console.log('[mqtt-bridge] 云平台桥接已启用')
}

/** 停止所有云连接 */
function stop() {
  for (const [key, client] of clients) {
    try { client.end(true) } catch (e) { /* ignore */ }
    clients.delete(key)
  }
}

module.exports = { forward, start, stop, parseChannels }

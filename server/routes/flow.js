'use strict'
/**
 * 流量查询路由: SIM 卡 / ICCID 流量使用查询
 *
 * 当前返回本地模拟数据; 公司云平台接入后,
 * 配置 config/index.js 的 flowApi.baseUrl / apiKey,
 * 本模块自动切换为调用云平台真实接口 (见 queryPlatform 的 TODO 位)。
 */
const express = require('express')
const router = express.Router()

const db = require('../db')
const config = require('../config')
const auth = require('../middleware/auth')
const { ok, fail, logOperation } = require('../utils/helpers')

// 卡号校验: SIM 手机卡号(11位) 或 ICCID(19~20位), 宽松收 8~20 位数字
function isCardNo(v) {
  return /^\d{8,20}$/.test(String(v || '').trim())
}

// 简单字符串哈希: 同一卡号多次查询结果稳定, 演示友好
function hashCode(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997
  return h
}

// 模拟数据生成 (公司云平台未接入时使用)
function genMock(cardNo) {
  const h = hashCode(cardNo)
  const operators = ['中国移动', '中国联通', '中国电信']
  const pkgs = [
    { name: '10GB/年 全国通用流量', total: 10 * 1024 },
    { name: '30GB/年 全国通用流量', total: 30 * 1024 },
    { name: '50GB/年 全国通用流量', total: 50 * 1024 },
    { name: '100GB/年 全国通用流量', total: 100 * 1024 }
  ]
  const pkg = pkgs[h % pkgs.length]
  const used = Math.round(pkg.total * (0.15 + (h % 70) / 100))
  const status = h % 10 === 9 ? '停机' : '正常'
  const expire = new Date()
  expire.setFullYear(expire.getFullYear() + 1)
  const pad = n => String(n).padStart(2, '0')
  // 近7天用量 (MB)
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      day: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      usedMB: Math.round(40 + ((h + i * 137) % 900))
    })
  }
  return {
    source: 'mock', // mock=本地模拟, platform=云平台实时
    cardNo,
    operator: operators[h % 3],
    package: pkg.name,
    totalMB: pkg.total,
    usedMB: used,
    remainMB: pkg.total - used,
    status,
    expireDate: `${expire.getFullYear()}-${pad(expire.getMonth() + 1)}-${pad(expire.getDate())}`,
    days
  }
}

// 调用公司云平台真实流量接口 (接入后启用)
async function queryPlatform(cardNo) {
  // TODO: 公司云平台接入 — 按云平台接口文档实现签名与请求, 例如:
  // const res = await axios.get(`${config.flowApi.baseUrl}/sim/${cardNo}/usage`, {
  //   headers: { Authorization: config.flowApi.apiKey },
  //   timeout: config.flowApi.timeout
  // })
  // return { source: 'platform', ...res.data }
  throw new Error('云平台流量接口未配置')
}

// ---------- 流量查询 ----------
router.get('/search', auth, async (req, res) => {
  const cardNo = String(req.query.cardNo || req.query.sim || '').trim()
  const { deviceId } = req.query
  if (!isCardNo(cardNo)) return fail(res, '请输入正确的卡号/ICCID (8~20位数字)')
  try {
    let data
    if (config.flowApi && config.flowApi.baseUrl) {
      data = await queryPlatform(cardNo)
    } else {
      data = genMock(cardNo)
    }
    logOperation(db, req.user.id, 'flow.search', 'flow', null, { cardNo, deviceId }, req.ip)
    ok(res, data)
  } catch (e) {
    console.error('[flow.search]', e)
    fail(res, e.message || '流量查询失败', 50000)
  }
})

module.exports = router

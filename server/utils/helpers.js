'use strict'
/**
 * 通用工具函数
 */

/** 统一成功响应 */
function ok(res, data = null, message = 'success') {
  res.json({ code: 20000, message, data })
}

/** 统一失败响应 */
function fail(res, message = 'error', code = 40000) {
  res.json({ code, message })
}

/** 分页参数解析 */
function pageParams(query, defaultSize = 20, maxSize = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const size = Math.min(maxSize, Math.max(1, parseInt(query.size, 10) || defaultSize))
  return { page, size, offset: (page - 1) * size }
}

/** 手机号校验 */
function isMobile(mobile) {
  return /^1\d{10}$/.test(mobile)
}

/** IMEI 校验 (15位数字) */
function isImei(imei) {
  return /^\d{8,18}$/.test(String(imei).trim())
}

/** 记录操作日志 */
function logOperation(db, userId, action, targetType, targetId, detail, ip) {
  try {
    db.prepare(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId || null, action, targetType || '', targetId || null,
      detail ? JSON.stringify(detail) : null, ip || '')
  } catch (e) { /* 日志失败不阻塞主流程 */ }
}

/** 生成 CSV/导出文件名 */
function exportFilename(prefix) {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.csv`
}

module.exports = { ok, fail, pageParams, isMobile, isImei, logOperation, exportFilename }

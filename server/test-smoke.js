'use strict'
/**
 * 后端 API 冒烟测试 (开发自检用)
 * 运行: node test-smoke.js  (需先启动 node app.js)
 */
const { DatabaseSync } = require('node:sqlite')

const BASE = 'http://localhost:3001'
const DB_PATH = require('path').join(__dirname, 'data', 'dtu.db')

let pass = 0
let fail = 0
let token = null

function check(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name}${extra ? ' — ' + JSON.stringify(extra) : ''}`) }
}

async function api(method, path, body, headers = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

/** 获取验证码并直接从本地库读取 code */
async function getCaptcha() {
  const { data } = await api('GET', '/api/verify')
  const db = new DatabaseSync(DB_PATH)
  const row = db.prepare('SELECT code FROM captcha_sessions WHERE uuid = ?').get(data.uuid)
  db.close()
  return { uuid: data.uuid, code: row.code }
}

/** 清理上一次测试的残留数据 (保证可重复运行) */
function cleanup() {
  const db = new DatabaseSync(DB_PATH)
  db.exec(`
    DELETE FROM devices WHERE imei IN ('868120239099001','868120239099002','868120239099003','868120239099999','868120239088888');
    DELETE FROM groups WHERE group_name LIKE '测试%';
    DELETE FROM users WHERE mobile = '13900000001';
    DELETE FROM device_heartbeats;
  `)
  db.close()
}

async function main() {
  cleanup()
  console.log('=== 1. 认证 ===')
  const { uuid, code } = await getCaptcha()
  const login = await api('POST', '/api/user/login', { mobile: '13800000000', password: 'admin123', code, uuid })
  check('管理员登录', login.code === 20000 && login.data.token, login)
  token = login.data.token
  const H = { 'X-Token': token }

  // 错误验证码应失败
  const badLogin = await api('POST', '/api/user/login', { mobile: '13800000000', password: 'admin123', code: 'xxxx', uuid })
  check('错误验证码被拒绝', badLogin.code !== 20000, badLogin)

  // 注册新用户
  const { uuid: u2, code: c2 } = await getCaptcha()
  const reg = await api('POST', '/api/user/register', { username: '测试用户', mobile: '13900000001', password: 'test123', code: c2, uuid: u2 })
  check('新用户注册', reg.code === 20000, reg)

  const info = await api('GET', '/api/user/info', null, H)
  check('获取用户信息', info.code === 20000 && info.data.role === 1 && info.data.deviceCount >= 0, info)

  console.log('=== 2. 设备 ===')
  const devList = await api('GET', '/api/device?page=1&size=5', null, H)
  check('设备列表', devList.code === 20000 && devList.data.total >= 3 && devList.data.items[0].group, devList)

  const add = await api('POST', '/api/device', { list: '868120239099001\n868120239099002\n868120239099001' }, H)
  check('批量添加设备(去重)', add.code === 20000 && add.data.added === 2, add)

  const dup = await api('POST', '/api/device', { list: '868120239099001' }, H)
  check('重复IMEI拒绝', dup.code === 20000 && dup.data.added === 0, dup)

  const groups = await api('GET', '/api/group', null, H)
  check('分组列表(含设备数量)', groups.code === 20000 && groups.data.total >= 1 && 'devices_count' in groups.data.items[0], groups)

  const gid = groups.data.items[0].id
  const cg = await api('POST', '/api/device/changeDeviceGroup', { deviceId: devList.data.items[0].id, groupId: gid }, H)
  check('修改设备分组', cg.code === 20000, cg)

  const tr = await api('POST', '/api/device/transfer', { phone: '13900000001', imeis: '868120239099002' }, H)
  check('转移设备归属', tr.code === 20000 && tr.data.count === 1, tr)

  const exportRes = await api('POST', '/api/device/exportDeviceList', {}, H)
  check('导出设备列表', exportRes.code === 20000 && exportRes.data.file, exportRes)

  console.log('=== 3. 分组 ===')
  const ng = await api('POST', '/api/group', { groupName: '测试分组A' }, H)
  check('创建分组', ng.code === 20000, ng)

  const detail = await api('GET', `/api/group/${ng.data.id}`, null, H)
  check('分组详情(含config)', detail.code === 20000 && typeof detail.data.config === 'string', detail)

  const cfg = JSON.parse(detail.data.config)
  cfg.param_ver = (cfg.param_ver || 0) + 1
  cfg.conf = [['mqtt', '300', '1800', 'mqtt.test.com', '1883', 'user', 'pass'], [], [], [], [], []]
  const up = await api('PUT', `/api/group/${ng.data.id}`, { config: JSON.stringify(cfg) }, H)
  check('更新分组配置(版本+1)', up.code === 20000, up)

  const cp = await api('POST', `/api/group/copy/${ng.data.id}`, { groupName: '测试分组B(复制)' }, H)
  check('复制分组', cp.code === 20000, cp)

  const del = await api('DELETE', `/api/group/${cp.data.id}`, null, H)
  check('删除分组', del.code === 20000, del)

  const delDefault = await api('DELETE', `/api/group/${gid}`, null, H)
  check('默认分组不可删除', delDefault.code !== 20000, delDefault)

  console.log('=== 4. 用户/权限 ===')
  const ulist = await api('GET', '/api/user/list', null, H)
  check('用户列表(admin)', ulist.code === 20000 && ulist.data.total >= 2, ulist)
  const target = ulist.data.items.find(u => u.mobile === '13900000001')

  // 普通用户权限验证 (在改角色之前)
  const { uuid: u3, code: c3 } = await getCaptcha()
  const login2 = await api('POST', '/api/user/login', { mobile: '13900000001', password: 'test123', code: c3, uuid: u3 })
  const H2 = { 'X-Token': login2.data.token }
  const userDev = await api('GET', '/api/device', null, H2)
  check('普通用户仅见自己设备', userDev.code === 20000 && userDev.data.items.length > 0 && userDev.data.items.every(d => d.user_id === target.id), userDev)
  const forbidden = await api('GET', '/api/user/list', null, H2)
  check('普通用户访问用户列表被拒', forbidden.code === 40300, forbidden)

  const cr = await api('PUT', '/api/user/changeRole', { uId: target.id, role: 1 }, H)
  check('修改用户角色', cr.code === 20000, cr)

  console.log('=== 5. IoT 接入 ===')
  const hb = await api('GET', `/iot/api/heartbeat?imei=868120239099001&csq=31&iccid=89860012345678901234&ver=v1.3.6&flow_used=1024000`)
  check('设备心跳上报', hb.code === 20000 && hb.data.deviceId, hb)

  const regDev = await api('POST', '/iot/api/register', { imei: '868120239099003', iccid: '89860011112222333344', hadr: 'V1.2', ver: 'v1.3.0' })
  check('设备注册', regDev.code === 20000 && regDev.data.config && regDev.data.config.param_ver, regDev)

  const dcfg = await api('GET', '/iot/api/config/868120239099001')
  check('设备拉取配置(含param_ver)', dcfg.code === 20000 && dcfg.data.param_ver === 25 && Array.isArray(dcfg.data.config.conf), dcfg)
  const dcfg2 = await api('GET', `/iot/api/config/868120239099002`)
  const g2 = await api('GET', '/api/group?page=1&size=100', null, H)
  const testGroup = g2.data.items.find(g => g.group_name === '测试分组A')
  check('测试分组配置存在', !!testGroup, g2)
  if (testGroup) {
    // 动态获取设备真实 id (自增序列会变化)
    const devs = await api('GET', '/api/device?imei=868120239099002', null, H)
    const targetDev = devs.data.items[0]
    if (targetDev) {
      const assign = await api('POST', '/api/group/setDeviceList', { groupId: testGroup.id, deviceIds: [targetDev.id] }, H)
      check('分配设备到分组', assign.code === 20000, assign)
      const dcfg3 = await api('GET', `/iot/api/config/868120239099002`)
      check('设备拉取分组配置(含MQTT通道)', dcfg3.code === 20000 && dcfg3.data.config.conf[0] && dcfg3.data.config.conf[0][0] === 'mqtt', dcfg3)
    } else {
      check('分配设备到分组(设备未找到)', false)
    }
  }

  const report = await api('POST', '/iot/api/report', { imei: '868120239099001', type: 'data', data: { temp: 25.6, hum: 60 } })
  check('设备数据上报', report.code === 20000, report)

  const flow = await api('GET', '/iot/api/flowSearch?imei=868120239099001')
  check('流量查询(心跳记录)', flow.code === 20000 && flow.data.total >= 1, flow)

  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(e => { console.error('测试异常:', e); process.exit(1) })

import request from '@/utils/request'

// 流量查询 (SIM卡号/ICCID) — 后端 /api/flow, 云平台接入后自动返回真实数据
export function searchFlow(params) {
  return request({
    url: '/flow/search',
    method: 'get',
    params
  })
}

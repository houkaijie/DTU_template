import request from '@/utils/request'

// 流量查询: 设备心跳/在线记录
export function flowSearch(params) {
  return request({
    url: '/iot/api/flowSearch',
    method: 'get',
    params
  })
}

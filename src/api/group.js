import request from '@/utils/request'

// 分组列表
export function groupList(params) {
  return request({
    url: '/group',
    method: 'get',
    params
  })
}

// 分组详情 (含 config)
export function groupInfo(id) {
  return request({
    url: `/group/${id}`,
    method: 'get'
  })
}

// 创建分组
export function saveGroup(data) {
  return request({
    url: '/group',
    method: 'post',
    data
  })
}

// 更新分组 (含 config)
export function updateGroup(id, data) {
  return request({
    url: `/group/${id}`,
    method: 'put',
    data
  })
}

// 删除分组
export function delGroup(id) {
  return request({
    url: `/group/${id}`,
    method: 'delete'
  })
}

// 复制分组
export function copyGroup(id, data) {
  return request({
    url: `/group/copy/${id}`,
    method: 'post',
    data
  })
}

// 分配设备到分组
export function setDeviceList(data) {
  return request({
    url: '/group/setDeviceList',
    method: 'post',
    data
  })
}

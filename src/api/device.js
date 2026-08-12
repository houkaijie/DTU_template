import request from '@/utils/request'

// 设备列表
export function deviceList(params) {
  return request({
    url: '/device',
    method: 'get',
    params
  })
}

// 批量添加设备
export function updateDeviceList(data) {
  return request({
    url: '/device',
    method: 'post',
    data
  })
}

// 删除设备
export function removeDevice(id) {
  return request({
    url: `/device/${id}`,
    method: 'delete'
  })
}

// 转移设备归属
export function transferDevice(phone, imeis) {
  return request({
    url: '/device/transfer',
    method: 'post',
    data: { phone, imeis }
  })
}

// 修改设备分组
export function changeDeviceGroup(data) {
  return request({
    url: '/device/changeDeviceGroup',
    method: 'post',
    data
  })
}

// 固件升级
export function updateDeviceSys(data) {
  return request({
    url: '/device/updateDeviceSys',
    method: 'post',
    data
  })
}

// 未绑定设备
export function notbindDevice(params) {
  return request({
    url: '/device/notbind',
    method: 'get',
    params
  })
}

// 绑定设备到当前用户 (与线上一致: 传 ids 列表)
export function bindDevice(id, ids) {
  return request({
    url: `/device/bind/${id}`,
    method: 'post',
    data: { ids }
  })
}

// 解绑设备 (与线上一致: DELETE)
export function unbindDevice(id) {
  return request({
    url: `/device/unbind/${id}`,
    method: 'delete'
  })
}

// 导出设备列表
export function exportDeviceList(params) {
  return request({
    url: '/device/exportDeviceList',
    method: 'post',
    data: params
  })
}

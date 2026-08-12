import request from '@/utils/request'

// 登录 (手机号+密码+图形验证码)
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

// 注册
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

// 获取图形验证码
export function getVerify() {
  return request({
    url: '/verify',
    method: 'get'
  })
}

// 获取用户信息
export function getInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

// 登出
export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}

// 修改密码
export function changePwd(data) {
  return request({
    url: '/user/changePwd',
    method: 'post',
    data
  })
}

// 发送短信验证码
export function sendCode(mobile) {
  return request({
    url: `/user/sendCode/${mobile}`,
    method: 'get'
  })
}

// 用户列表 (admin)
export function getUserList(params) {
  return request({
    url: '/user/list',
    method: 'get',
    params
  })
}

// 修改用户角色 (admin)
export function changeUserRole(data) {
  return request({
    url: '/user/changeRole',
    method: 'put',
    data
  })
}

// 仪表盘统计
export function dashboardStats() {
  return request({
    url: '/dashboard/stats',
    method: 'get'
  })
}

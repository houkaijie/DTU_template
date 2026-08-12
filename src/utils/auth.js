// 与线上一致: token 存 localStorage (key: DUT_ADMIN_TOKEN)
const TokenKey = 'DUT_ADMIN_TOKEN'

export function getToken() {
  return localStorage.getItem(TokenKey)
}

export function setToken(token) {
  return localStorage.setItem(TokenKey, token)
}

export function removeToken() {
  return localStorage.removeItem(TokenKey)
}

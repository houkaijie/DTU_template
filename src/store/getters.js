const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  userInfo: state => state.user.userInfo,
  userId: state => state.user.userInfo.id,
  mobile: state => state.user.userInfo.mobile,
  role: state => state.user.userInfo.role
}
export default getters

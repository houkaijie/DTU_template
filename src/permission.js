import router, { asyncRoutes } from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/register'] // no redirect whitelist

// 按角色注册动态路由 (admin → /user/list)
export function generateRoutes(role) {
  const accessedRoutes = asyncRoutes.filter(route => {
    if (route.meta && route.meta.roles) {
      return route.meta.roles.includes('admin') && Number(role) === 1
    }
    return true
  })
  // vue-router 3.0.6 只有 addRoutes (addRoute 是 3.1.0+ 才有)
  accessedRoutes.forEach(route => router.addRoutes([route]))
  return accessedRoutes
}

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login' || to.path === '/register') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done()
    } else {
      const hasUserInfo = store.getters.userInfo && store.getters.userInfo.id
      if (hasUserInfo) {
        next()
      } else {
        try {
          // get user info
          const info = await store.dispatch('user/getInfo')
          // 注册管理员动态路由
          generateRoutes(info.role)
          next({ ...to, replace: true })
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})

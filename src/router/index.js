import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * constantRoutes: 所有角色可访问
 * asyncRoutes: 按角色动态注册 (meta.roles: ['admin'])
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },

  {
    path: '/register',
    component: () => import('@/views/register/index'),
    hidden: true
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    component: Layout,
    redirect: '/device/list',
    hidden: true,
    children: [{
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/index'),
      meta: { title: '系统概览', icon: 'dashboard' }
    }]
  },

  {
    path: '/device',
    component: Layout,
    redirect: '/device/list',
    children: [{
      path: 'list',
      name: 'DeviceList',
      component: () => import('@/views/device/list'),
      meta: { title: '设备管理', icon: 'table' }
    }]
  },

  {
    path: '/group',
    component: Layout,
    redirect: '/group/list',
    children: [{
      path: 'list',
      name: 'GroupList',
      component: () => import('@/views/group/list'),
      meta: { title: '分组管理', icon: 'tree' }
    }]
  },

  {
    path: '/flowSearch',
    component: Layout,
    redirect: '/flowSearch',
    children: [{
      path: '',
      name: 'FlowSearch',
      component: () => import('@/views/flowsearch/index'),
      meta: { title: '流量查询', icon: 'form' }
    }]
  },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]

/**
 * asyncRoutes: 管理员专属路由
 */
export const asyncRoutes = [
  {
    path: '/user',
    component: Layout,
    redirect: '/user/list',
    meta: { roles: ['admin'] },
    children: [{
      path: 'list',
      name: 'UserList',
      component: () => import('@/views/user/list'),
      meta: { title: '用户角色', icon: 'user', roles: ['admin'] }
    }]
  }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router

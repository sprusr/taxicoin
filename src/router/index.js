import Vue from 'vue'
import Router from 'vue-router'

import NewHome from '@/components/pages/NewHome'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: NewHome
    }
  ]
})

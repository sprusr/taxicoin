import Vue from 'vue'
import Router from 'vue-router'

import HomePage from '@/components/pages/HomePage'
import AboutPage from '@/components/pages/AboutPage'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomePage
    },
    {
      path: '/about',
      name: 'About',
      component: AboutPage
    }
  ]
})

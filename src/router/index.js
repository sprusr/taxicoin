import Vue from 'vue'
import Router from 'vue-router'

import HomePage from '@/components/pages/HomePage'
import AboutPage from '@/components/pages/AboutPage'
import RidePage from '@/components/pages/RidePage'
import DrivePage from '@/components/pages/DrivePage'

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
    },
    {
      path: '/ride',
      name: 'Ride',
      component: RidePage
    },
    {
      path: '/drive',
      name: 'Drive',
      component: DrivePage
    }
  ]
})

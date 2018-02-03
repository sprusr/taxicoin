import Vue from 'vue'
import Router from 'vue-router'

import SettingsPage from '@/components/pages/SettingsPage'
import RidePage from '@/components/pages/RidePage'
import RiderJourneyPage from '@/components/pages/RiderJourneyPage'
import DrivePage from '@/components/pages/DrivePage'
import DriverJourneyPage from '@/components/pages/DriverJourneyPage'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/ride'
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    },
    {
      path: '/ride',
      name: 'rider',
      component: RidePage
    },
    {
      path: '/ride/journey',
      name: 'riderJourney',
      component: RiderJourneyPage
    },
    {
      path: '/drive',
      name: 'driver',
      component: DrivePage
    },
    {
      path: '/drive/journey',
      name: 'driverJourney',
      component: DriverJourneyPage
    }
  ]
})

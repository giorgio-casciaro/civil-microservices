import Vue from 'vue'
import Router from 'vue-router'
import Menu from '@/components/Menu'
import Account from '@/components/Account'
import Home from '@/pages/Home'
import Registration from '@/pages/Registration'
// import Dashboards from '@/pages/Dashboards'
// import Dashboard from '@/pages/Dashboard'
// import DashboardSubscriptions from '@/pages/DashboardSubscriptions'
// import DashboardEditInfo from '@/pages/EditInfo'
// import DashboardEditMaps from '@/pages/EditMaps'
// import DashboardEditImages from '@/pages/EditImages'
// import Profile from '@/pages/Profile'

Vue.use(Router)

export default (extraRoutes = []) => {
  var routes = [
    {
      path: '/',
      name: 'Home',
      components: {
        default: Home,
        menu: Menu,
        account: Account
      }
    },
    // {
    //   path: '/profile/',
    //   name: 'Profilo',
    //   components: {
    //     default: Profile,
    //     menu: Menu,
    //     account: Account
    //   }
    // },
    {
      path: '/registration/:step?/:email?/:emailConfirmationCode?',
      name: 'Registrazione',
      components: {
        default: Registration,
        menu: Menu,
        account: Account
      }
    }
    // {
    //   path: '/dashboards/',
    //   name: 'Bacheche',
    //   components: {
    //     default: Dashboards,
    //     menu: Menu,
    //     account: Account
    //   }
    // },
    // {
    //   path: '/dashboard/:dashId?',
    //   name: 'Posts',
    //   components: {
    //     default: Dashboard,
    //     menu: Menu,
    //     account: Account
    //   }
    // },
    // {
    //   path: '/DashboardSubscriptions/:dashId?',
    //   name: 'Subscriptions',
    //   components: {
    //     default: DashboardSubscriptions,
    //     menu: Menu,
    //     account: Account
    //   }
    // },
    // {
    //   path: '/dashboardCreate/',
    //   name: 'Crea Bacheca',
    //   components: {
    //     default: DashboardEditInfo,
    //     menu: Menu,
    //     account: Account
    //   }
    // },
    // {
    //   path: '/dashboardEdit/:dashId?',
    //   name: 'Modifica Info Bacheca',
    //   components: {
    //     default: DashboardEditInfo,
    //     menu: Menu,
    //     account: Account
    //   }
    // },
    // {
    //   path: '/dashboardEditMaps/:dashId?',
    //   name: 'Modifica Mappe Bacheca',
    //   components: {
    //     default: DashboardEditMaps,
    //     menu: Menu,
    //     account: Account
    //   }
    // },
    // {
    //   path: '/dashboardEditImages/:dashId?',
    //   name: 'Modifica Immagini Bacheca',
    //   components: {
    //     default: DashboardEditImages,
    //     menu: Menu,
    //     account: Account
    //   }
    // }
  ].concat(extraRoutes)
  console.log('routes', routes)
  return new Router({routes})
}

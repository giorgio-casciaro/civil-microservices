import Vue from 'vue'
import Router from 'vue-router'
import Menu from '@/components/Menu'
import Home from '@/components/Home'
import Account from '@/components/Account'
import Registration from '@/components/Registration'
import Dashboards from '@/components/Dashboards'
import Dashboard from '@/components/Dashboard'
import DashboardEdit from '@/components/DashboardEdit'
import DashboardCreate from '@/components/DashboardCreate'
import Profile from '@/components/Profile'

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
    {
      path: '/profile/',
      name: 'Profilo',
      components: {
        default: Profile,
        menu: Menu,
        account: Account
      }
    },
    {
      path: '/registration/:step?/:email?/:emailConfirmationCode?',
      name: 'Registrazione',
      components: {
        default: Registration,
        menu: Menu,
        account: Account
      }
    },
    {
      path: '/dashboards/',
      name: 'Bacheche',
      components: {
        default: Dashboards,
        menu: Menu,
        account: Account
      }
    },
    {
      path: '/dashboard/:dashId?',
      name: 'Bacheca',
      components: {
        default: Dashboard,
        menu: Menu,
        account: Account
      }
    },
    {
      path: '/dashboardCreate/',
      name: 'Modifica Bacheca',
      components: {
        default: DashboardCreate,
        menu: Menu,
        account: Account
      }
    },
    {
      path: '/dashboardEdit/:dashId?',
      name: 'Crea Bacheca',
      components: {
        default: DashboardEdit,
        menu: Menu,
        account: Account
      }
    }
  ].concat(extraRoutes)
  console.log('routes', routes)
  return new Router({routes})
}

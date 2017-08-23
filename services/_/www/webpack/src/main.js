// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from '@/App'

import store from '@/store'
import VueResource from 'vue-resource'

Vue.use(VueResource)
Vue.config.productionTip = false

var extraRoutes = [] // FOR ROUTER

// USERS MODULE
import usersStore from './users/store'
store.registerModule('users', usersStore)

// DASHBOADS MODULE
import dashboardsStore from './dashboards/store'
store.registerModule('dashboards', dashboardsStore)

import getRouter from './router'
var router = getRouter(extraRoutes)

// import * as Cookies from 'js-cookie'
// var cookieVal = Cookies.getJSON('civil-connect-tokens')
// store.commit('users/FROM_STORAGE', cookieVal)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', function() {
//     navigator.serviceWorker.register('/sw.js').then(function(registration) {
//       // Registration was successful
//       console.log('ServiceWorker registration successful with scope: ', registration.scope);
//     }, function(err) {
//       // registration failed :(
//       console.log('ServiceWorker registration failed: ', err);
//     });
//   });
// }

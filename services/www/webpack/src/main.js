// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from '@/App'

import store from '@/store'
import VueResource from 'vue-resource'

Vue.use(VueResource)
Vue.config.productionTip = false

var extraRoutes = [] // FOR ROUTER

import usersStore from './modules/users/store'
store.registerModule('users', usersStore)

// import dashboardsStore from './modules/dashboards/store'
// store.registerModule('dashboards', dashboardsStore)

import getRouter from './router'
var router = getRouter(extraRoutes)

/* eslint-disable no-new */
var MainVue = new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
store.commit('MAIN_VUE', MainVue)
// store.dispatch('dashboards/init')
// store.dispatch('subscriptions/init')
// store.dispatch('posts/init')
store.dispatch('notifications/init')
store.dispatch('users/init')

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

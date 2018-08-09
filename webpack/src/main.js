// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from '@/App'

import store from '@/store'
import VueResource from 'vue-resource'

import usersStore from './modules/users/store'
import getRouter from './router'

Vue.use(VueResource)
Vue.config.productionTip = false

var extraRoutes = [] // FOR ROUTER

store.registerModule('users', usersStore)

// import dashboardsStore from './modules/dashboards/store'
// store.registerModule('dashboards', dashboardsStore)

var router = getRouter(extraRoutes)

/* eslint-disable no-new */
var MainVue = new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
store.mainVue = MainVue
// store.dispatch('dashboards/init')
// store.dispatch('subscriptions/init')
// store.dispatch('posts/init')
// store.dispatch('notifications/init')
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

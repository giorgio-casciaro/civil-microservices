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

// LONG POLLING
// Not a real URL, just using for demo purposes
// var es = new EventSource(store.state.apiServer + '/liveevents/getEvents')
// var es = new EventSource('http://127.0.0.1:11000/getEvents')
//
// es.addEventListener('message', event => {
//   console.log('EventSource message', event.data, event)
//   // let data = JSON.parse(event.data)
//   // this.stockData = data.stockData
// }, false)
//
// es.addEventListener('open', event => {
//   console.log('EventSource open', event.data, event)
//   // let data = JSON.parse(event.data)
//   // this.stockData = data.stockData
// }, false)
//
// es.addEventListener('error', event => {
//   if (event.readyState === EventSource.CLOSED) {
//     console.log('EventSource error', event.data, event)
//   }
// }, false)

// function longPolling () {
//   console.log('longPolling start')
//   var xhr = new XMLHttpRequest()
//   xhr.responseType = 'json'// or 'text', 'json', ect. there are other types.
//   xhr.timeout = 60000// milliseconds until timeout fires. (1 minute)
//   xhr.onload = function (e2) {
//     // var blob = xhr.response
//     console.log('longPolling', xhr.response)
//     // handle response data
//   }
//   xhr.ontimeout = function () {
//     console.log('longPolling timeout')
//     longPolling()
//     // if you get this you probably should try to make the connection again.
//     // the browser should've killed the connection.
//   }
//   xhr.open('GET', '/api/liveevents/getEvents', true)
//   xhr.send()
// }
// longPolling()
// import * as Cookies from 'js-cookie'
// var cookieVal = Cookies.getJSON('civil-connect-tokens')
// store.commit('users/FROM_STORAGE', cookieVal)

/* eslint-disable no-new */
var MainVue = new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
store.commit('MAIN_VUE', MainVue)
store.dispatch('dashboards/init')
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

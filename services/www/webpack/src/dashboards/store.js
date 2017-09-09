import {validate, call} from '@/api'
import Vue from 'vue'

import * as Cookies from 'js-cookie'
var initState = {
  listPopular: false,
  listActive: false,
  subscriptions: false,
  dashboardsMeta: {},
  listCount: 0,
  dashboardsById: {},
  listPostsCount: {},
  postsById: {},
  listPosts: {},
  listSubscriptionsCount: {},
  subscriptionsById: {},
  subscriptionsByDashboardId: {},
  listSubscriptions: {},
  list: []
}
// PREPOPULATE WITH LOCAL DATA
if (localStorage && localStorage.getItem('dashboardsState')) {
  var lsState = JSON.parse(localStorage.getItem('dashboardsState'))
}
var pageLength = 20
// var token = Cookies.getJSON('civil-connect-token')
var storeModule = {
  namespaced: true,
  state: Object.assign({}, lsState || initState),
  mutations: {
    DASHBOARDS_LIST (state, payload) {
      if (payload.reset)Vue.set(state, 'list', [])
      Vue.set(state, 'list', state.list.concat(payload.list))
      Vue.set(state, 'listCount', state.list.length)
      // list.forEach((dashboard) => { Vue.set(state.dashboardsById, dashboard.id, dashboard) })
      console.log('dashboardsById', state.dashboardsById)
    },
    DASHBOARDS_META (state, meta) {
      Vue.set(state, 'dashboardsMeta', meta)
      console.log('DASHBOARDS_META', meta)
    },
    DASHBOARD_POSTS_LIST (state, payload) {
      if (payload.reset)Vue.set(state.listPosts, payload.dashId, [])
      Vue.set(state.listPosts, payload.dashId, (state.listPosts[payload.dashId] || []).concat(payload.list))
      Vue.set(state.listPostsCount, payload.dashId, state.listPosts[payload.dashId].length)
      payload.list.forEach((post) => { Vue.set(state.postsById, post.id, post) })
      console.log('DASHBOARD_POSTS_LIST', payload, state.listPosts, state.postsById)
    },
    DASHBOARD_SUBSCRIPTIONS_LIST (state, payload) {
      if (payload.reset)Vue.set(state.listSubscriptions, payload.dashId, [])
      Vue.set(state.listSubscriptions, payload.dashId, (state.listSubscriptions[payload.dashId] || []).concat(payload.list))
      Vue.set(state.listSubscriptionsCount, payload.dashId, state.listSubscriptions[payload.dashId].length)
      payload.list.forEach((subscription) => { Vue.set(state.subscriptionsById, subscription.id, subscription) })
      console.log('DASHBOARD_SUBSCRIPTIONS_LIST', payload, state.listSubscriptions, state.subscriptionsById)
    },
    MY_SUBSCRIPTIONS_LIST (state, list) {
      Vue.set(state, 'subscriptions', list)
      list.forEach((subscription) => {
        Vue.set(state.subscriptionsById, subscription.id, subscription)
        Vue.set(state.subscriptionsByDashboardId, subscription.dashId, subscription)
        Vue.set(state.dashboardsById, subscription.dashId, subscription.dashInfo)
      })
      console.log('MY_SUBSCRIPTIONS_LIST', state.subscriptions)
    },
    MY_SUBSCRIPTIONS_RESET (state, list) {
      Vue.set(state, 'subscriptions', [])
      console.log('MY_SUBSCRIPTIONS_RESET', state.subscriptions)
    }
  },
  actions: {
    init (store, payload) {
      call('dashboards', 'getDashboardsMeta', {}, (payload) => store.commit('DASHBOARDS_META', payload))
      store.rootState.mainVue.$on('login', clickCount => {
        console.log('dashboards store on login event')
        store.dispatch('getMySubscriptions')
      })
      store.rootState.mainVue.$on('logout', clickCount => {
        console.log('dashboards store on logout event')
        store.commit('MY_SUBSCRIPTIONS_RESET')
      })
    },
    getMySubscriptions (store, payload) {
      call('dashboards', 'getUserSubscriptions', {}, (payload) => store.commit('MY_SUBSCRIPTIONS_LIST', payload))
    },
    newSubscription (store, payload) {
      call('dashboards', 'createSubscription', {}, (payload) => store.dispatch('getMySubscriptions', {}))
    },
    // getDashboardById (store, payload) {
    //   call('dashboards', 'getUserSubscriptions', {}, (payload) => store.commit('SUBSCRIPTIONS_LIST', payload))
    // },
    lastDashboards (store, payload) {
      call('dashboards', 'queryLastDashboards', {from: 0, to: pageLength}, (list) => store.commit('DASHBOARDS_LIST', {list, reset: true}))
    },
    lastDashboardsLoadMore (store, payload) {
      call('dashboards', 'queryLastDashboards', {from: store.state.listCount, to: store.state.listCount + pageLength}, (list) => store.commit('DASHBOARDS_LIST', {list, reset: false}))
    },
    lastDashboardPosts (store, payload) {
      call('dashboards', 'queryLastPosts', {from: 0, to: pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_POSTS_LIST', {list, dashId: payload.dashId, reset: true}))
    },
    lastDashboardPostsLoadMore (store, payload) {
      call('dashboards', 'queryLastPosts', {from: store.state.listPostsCount[payload.dashId], to: store.state.listPostsCount[payload.dashId] + pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_POSTS_LIST', {list, dashId: payload.dashId}))
    },
    lastDashboardSubscriptions (store, payload) {
      console.log('lastDashboardSubscriptions', payload)
      call('dashboards', 'queryLastSubscriptions', {from: 0, to: pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId, reset: true}))
    },
    lastDashboardSubscriptionsLoadMore (store, payload) {
      call('dashboards', 'queryLastSubscriptions', {from: store.state.listSubscriptionsCount[payload.dashId], to: store.state.listSubscriptionsCount[payload.dashId] + pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId}))
    },
    afterLogin (store, payload) {
      // call('dashboards', 'queryLastDashboards', {}, (payload) => store.commit('DASHBOARDS_LIST', payload))
    }
  }
}
export default storeModule

//
// const httpApiPost = (url, request, mutation, filterResponse = (x) => x, errorMutation = 'APP_ERROR') => {
//   console.log('httpApiPost', url, request)
//   // Vue.http.post(url, request)
//   // .then(response => response.error ? store.commit(errorMutation, { type: 'login', error: response }) : store.commit(mutation, filterResponse(response)))
//   // .catch(error => store.commit(errorMutation, {type: 'httpPost', url, request, error}))
// }
// const getUrl = (server, service, method) => server + '/' + service + '/' + method

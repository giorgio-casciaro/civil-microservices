import {validate, call} from '@/api'
import Vue from 'vue'
const mapboxgl = require('mapbox-gl')

import * as Cookies from 'js-cookie'
var initState = {
  listPopular: false,
  listActive: false,
  userSubscriptions: false,
  userSubscriptionsByDashboardId: {},
  dashboardsMeta: {},
  dashboardsById: {},
  dashboardsMaps: {},
  dashboardsMapsPoints: {},
  // dashboardsPostsListCount: {},
  // postsById: {},
  dashboardsPostsList: {},
  // dashboardsSubscriptionsListCount: {},

  // subscriptionsById: {},
  // extendedSubscriptionsById: {},
  // subscriptionsByDashboardId: {},
  dashboardsSubscriptionsList: {},
  lastDashboards: []
}
var lsState
// PREPOPULATE WITH LOCAL DATA
// if (localStorage && localStorage.getItem('dashboardsState')) {
//   lsState = JSON.parse(localStorage.getItem('dashboardsState'))
// }
var pageLength = 20
// var token = Cookies.getJSON('civil-connect-token')
var storeModule = {
  namespaced: true,
  state: Object.assign({}, lsState || initState),
  mutations: {
    LAST_DASHBOARDS (state, payload) {
      if (payload.reset)Vue.set(state, 'list', [])
      Vue.set(state, 'lastDashboards', state.list.concat(payload.list))
    },
    DASHBOARDS_META (state, meta) {
      Vue.set(state, 'dashboardsMeta', meta)
      console.log('DASHBOARDS_META', meta)
    },
    DASHBOARD_POSTS_LIST (state, payload) {
      if (payload.reset)Vue.set(state.dashboardsPostsList, payload.dashId, [])
      Vue.set(state.dashboardsPostsList, payload.dashId, (state.dashboardsPostsList[payload.dashId] || []).concat(payload.list))
      // Vue.set(state.dashboardsPostsListCount, payload.dashId, state.dashboardsPostsList[payload.dashId].length)
      // payload.list.forEach((post) => { Vue.set(state.postsById, post.id, post) })
      console.log('DASHBOARD_POSTS_LIST', payload, state.dashboardsPostsList, state.postsById)
    },
    DASHBOARD_SUBSCRIPTIONS_LIST (state, payload) {
      if (payload.reset)Vue.set(state.dashboardsSubscriptionsList, payload.dashId, [])
      Vue.set(state.dashboardsSubscriptionsList, payload.dashId, (state.dashboardsSubscriptionsList[payload.dashId] || []).concat(payload.list))
      // Vue.set(state.dashboardsSubscriptionsListCount, payload.dashId, state.dashboardsSubscriptionsList[payload.dashId].length)
      // payload.list.forEach((subscription) => { Vue.set(state.subscriptionsById, subscription.id, subscription) })
      console.log('DASHBOARD_SUBSCRIPTIONS_LIST', payload, state.dashboardsSubscriptionsList, state.subscriptionsById)
    },
    USER_SUBSCRIPTIONS (state, list) {
      Vue.set(state, 'userSubscriptions', list)
      list.forEach((subscription) => { Vue.set(state.userSubscriptionsByDashboardId, subscription.dashId, subscription) })
    },
    USER_SUBSCRIPTIONS_RESET (state, list) {
      Vue.set(state, 'userSubscriptions', [])
      console.log('USER_SUBSCRIPTIONS_RESET', state.subscriptions)
    },
    LOAD_DASHBOARD (state, dashboard) {
      Vue.set(state.dashboardsById, dashboard.id, dashboard)
      console.log('LOAD_DASHBOARD', dashboard)
    },
    SUBSCRIPTIONS_LOADED (state, list) {
      list.forEach((subscription) => {
        Vue.set(state.subscriptionsById, subscription.id, subscription)
      })
      console.log('SUBSCRIPTIONS_LOADED', list)
    },
    CHANGE_DASHBOARD_RANDOM (state, {dashId, random}) {
      state.dashboardsById[dashId].random = random
    },
    SET_DASHBOARD_ACTIVE_MAP (state, {map, dashId}) {
      state.dashboardsMaps[dashId] = map
      console.log('SET_DASHBOARD_ACTIVE_MAP', {map, dashId})
    },
    CREATE_POST (state, payload) {
      state.dashboardsPostsList[payload.dashId].unshift(payload)
      Vue.set(state.dashboardsPostsList, payload.dashId, state.dashboardsPostsList[payload.dashId])
    },
    ADD_DASHBOARD_MAP_POINT (state, point) {
      if (!state.dashboardsMapsPoints[point.dashId])state.dashboardsMapsPoints[point.dashId] = {}
      state.dashboardsMapsPoints[point.dashId][point.id] = point
      console.log('ADD_DASHBOARD_MAP_POINT', point)
    },
    ADD_DASHBOARD_MAP_POINT_MARKER (state, {point, marker}) {
      state.dashboardsMapsPoints[point.dashId][point.id].marker = marker
      console.log('ADD_DASHBOARD_MAP_POINT_MARKER', {point, marker})
    }
  },
  actions: {
    init (store, payload) {
      call('dashboards', 'getDashboardsMeta', {}, (payload) => store.commit('DASHBOARDS_META', payload))
      store.rootState.mainVue.$on('login', clickCount => {
        console.log('dashboards store on login event')
        store.dispatch('getUserSubscriptions')
      })
      store.rootState.mainVue.$on('logout', clickCount => {
        console.log('dashboards store on logout event')
        store.commit('USER_SUBSCRIPTIONS_RESET')
      })
    },
    getUserSubscriptions (store, payload) {
      call('dashboards', 'getExtendedSubscriptionsByUserId', {}, (payload) => {
        store.commit('USER_SUBSCRIPTIONS', payload)
        // store.rootState.mainVue.$emit('USER_SUBSCRIPTIONS')
      })
    },
    createPost (store, payload) {
      store.dispatch('users/createGuest', {
        guest: payload.guest,
        onError: payload.onError,
        onSuccess: function (guestUserId) {
          payload.post.userId = guestUserId
          call('dashboards', 'createPost', payload.post, (response) => {
            store.commit('CREATE_POST', response.data)
            payload.onSuccess()
          }, payload.onError)
        }
      }, {root: true})
      // if (!store.state.users.logged) {
      //   call('users', 'createGuest', payload.guest, function () {
      //     call('dashboards', 'createPost', payload.post, (payload) => {
      //       store.commit('CREATE_POST', payload)
      //       payload.succ()
      //     }, payload.err)
      //   }, payload.err)
      // } else {
      //   call('dashboards', 'createPost', payload.post, (payload) => {
      //     store.commit('CREATE_POST', payload)
      //     payload.succ()
      //   }, payload.err)
      // }
    },
    // readMultipleSubscriptions (store, payload) {
    //   var ids = []
    //   var id
    //   if (!payload.refresh) {
    //     for (var i = 0; i < payload.ids.length; i++) {
    //       id = payload.ids[i]
    //       if (!store.state.subscriptionsById[id])ids.push(id)
    //     }
    //   } else {
    //     ids = payload.ids
    //   }
    //   console.log('readMultipleSubscriptions', {ids})
    //   if (ids.length) {
    //     call('dashboards', 'readMultipleSubscriptions', {ids}, (response) => {
    //       console.log('readMultipleSubscriptions response', response)
    //       store.commit('SUBSCRIPTIONS_LOADED', response)
    //     })
    //   }
    // },
    lastDashboards (store, payload) {
      call('dashboards', 'queryLastDashboards', {from: 0, to: pageLength}, (list) => store.commit('LAST_DASHBOARDS', {list, reset: true}))
    },
    loadDashboard (store, id) {
      call('dashboards', 'read', {id}, (dashboard) => store.commit('LOAD_DASHBOARD', dashboard))
    },
    lastDashboardsLoadMore (store, payload) {
      call('dashboards', 'queryLastDashboards', {from: store.state.lastDashboards.length, to: store.state.lastDashboards.length + pageLength}, (list) => store.commit('LAST_DASHBOARDS', {list, reset: false}))
    },
    lastDashboardPosts (store, payload) {
      call('dashboards', 'queryLastPosts', {from: 0, to: pageLength, dashId: payload.dashId}, (list) => {
        store.commit('DASHBOARD_POSTS_LIST', {list, dashId: payload.dashId, reset: true})
      })
    },
    lastDashboardPostsLoadMore (store, payload) {
      call('dashboards', 'queryLastPosts', {from: store.state.dashboardsPostsListCount[payload.dashId], to: store.state.dashboardsPostsListCount[payload.dashId] + pageLength, dashId: payload.dashId}, (list) => {
        store.commit('DASHBOARD_POSTS_LIST', {list, dashId: payload.dashId})
        // store.dispatch('readMultipleSubscriptions', { ids: list.map((post) => post.subscriptionId) })
        // store.dispatch('users/readUsers', {ids: list.map((post) => post.userId)}, {root: true})
      })
    },
    lastDashboardSubscriptions (store, payload) {
      call('dashboards', 'queryLastSubscriptions', {from: 0, to: pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId, reset: true}))
    },
    lastDashboardSubscriptionsLoadMore (store, payload) {
      call('dashboards', 'queryLastSubscriptions', {from: store.state.dashboardsSubscriptionsListCount[payload.dashId], to: store.state.dashboardsSubscriptionsListCount[payload.dashId] + pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId}))
    },
    subscribe (store, payload) {
      call('dashboards', 'createSubscription', payload, (payload) => store.dispatch('getUserSubscriptions', {}))
      // call('dashboards', 'queryLastSubscriptions', {from: store.state.dashboardsSubscriptionsListCount[payload.dashId], to: store.state.dashboardsSubscriptionsListCount[payload.dashId] + pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId}))
    },
    afterLogin (store, payload) {
    },
    setDashboardActiveMap (store, payload) {
      store.commit('SET_DASHBOARD_ACTIVE_MAP', payload)
      store.dispatch('refreshDashboardActiveMap', {dashId: payload.dashId})
    },
    refreshDashboardActiveMap (store, payload) {
      if (!store.state.dashboardsMapsPoints[payload.dashId] || !store.state.dashboardsMaps[payload.dashId]) return false
      var map = store.state.dashboardsMaps[payload.dashId]
      var points = store.state.dashboardsMapsPoints[payload.dashId]
      console.log('refreshDashboardActiveMap', payload, map, points)
      var i
      var point
      for (i in points) {
        point = points[i]
        var el = document.createElement('div')
        el.className = 'marker'
        var ll = new mapboxgl.LngLat(point.lng, point.lat)
        var marker = new mapboxgl.Marker(el, {}).setLngLat(ll).addTo(map)
        store.commit('ADD_DASHBOARD_MAP_POINT_MARKER', {point, marker})
      }
    },
    addDashboardMapPoint (store, payload) {
      store.commit('ADD_DASHBOARD_MAP_POINT', payload)
      store.dispatch('refreshDashboardActiveMap', {dashId: payload.dashId})

      // store.commit('SET_DASHBOARD_ACTIVE_MAP', payload)
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

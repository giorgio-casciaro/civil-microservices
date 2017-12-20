import {validate, call} from '@/api'
import Vue from 'vue'
import * as Cookies from 'js-cookie'
import {translate} from '@/i18n'

const mapboxgl = require('mapbox-gl')

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
  postsById: {},
  dashboardsPostsList: {},
  subscriptionsById: {},
  // dashboardsSubscriptionsListCount: {},

  // subscriptionsById: {},
  // extendedSubscriptionsById: {},
  // subscriptionsByDashboardId: {},
  dashboardsSubscriptionsList: {},
  postsMutations: false,
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
      var dataState = state.dashboardsPostsList[payload.dashId]
      if (payload.reset || !dataState) dataState = {status: 'loading', items: []}
      if (payload.status) dataState.status = payload.status
      if (payload.add) {
        dataState.items = dataState.items.concat(payload.add.map((post) => post.id))
        payload.add.forEach((post) => Vue.set(state.postsById, post.id, post))
      }
      Vue.set(state.dashboardsPostsList, payload.dashId, dataState)
      console.log('DASHBOARD_POSTS_LIST', payload, dataState, state.dashboardsPostsList[payload.dashId])
    },
    DASHBOARD_SUBSCRIPTIONS_LIST (state, payload) {
      var dataState = state.dashboardsSubscriptionsList[payload.dashId]
      if (payload.reset || !dataState) dataState = {status: 'loading', items: []}
      if (payload.status) dataState.status = payload.status
      if (payload.add) {
        dataState.items = dataState.items.concat(payload.add.map((subscription) => subscription.id))
        payload.add.forEach((subscription) => Vue.set(state.subscriptionsById, subscription.id, subscription))
      }
      Vue.set(state.dashboardsSubscriptionsList, payload.dashId, dataState)
      console.log('DASHBOARD_SUBSCRIPTIONS_LIST', payload, dataState, state.dashboardsSubscriptionsList[payload.dashId])
    },
    // DASHBOARD_SUBSCRIPTIONS_LIST (state, payload) {
    //   if (payload.reset)Vue.set(state.dashboardsSubscriptionsList, payload.dashId, [])
    //   Vue.set(state.dashboardsSubscriptionsList, payload.dashId, (state.dashboardsSubscriptionsList[payload.dashId] || []).concat(payload.list))
    //   // Vue.set(state.dashboardsSubscriptionsListCount, payload.dashId, state.dashboardsSubscriptionsList[payload.dashId].length)
    //   // payload.list.forEach((subscription) => { Vue.set(state.subscriptionsById, subscription.id, subscription) })
    //   console.log('DASHBOARD_SUBSCRIPTIONS_LIST', payload, state.dashboardsSubscriptionsList, state.subscriptionsById)
    // },
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
    LOAD_POST (state, post) {
      Vue.set(state.postsById, post.id, post)
      console.log('LOAD_POST', post)
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
    CREATE_POST (state, post) {
      state.dashboardsPostsList[post.dashId].items.unshift(post.id)
      Vue.set(state.dashboardsPostsList[post.dashId], 'items', state.dashboardsPostsList[post.dashId].items)
      Vue.set(state.postsById, post.id, post)
    },
    POST_CONFIRMED (state, id) {
      Vue.set(state.postsById[id], '_confirmed', 1)
    },
    ADD_DASHBOARD_MAP_POINT (state, point) {
      if (!state.dashboardsMapsPoints[point.dashId])state.dashboardsMapsPoints[point.dashId] = {}
      state.dashboardsMapsPoints[point.dashId][point.id] = point
      console.log('ADD_DASHBOARD_MAP_POINT', point)
    },
    ADD_DASHBOARD_MAP_POINT_MARKER (state, {point, marker}) {
      state.dashboardsMapsPoints[point.dashId][point.id].marker = marker
      console.log('ADD_DASHBOARD_MAP_POINT_MARKER', {point, marker})
    },
    LOAD_MUTATIONS_POST (state, mutationsStringFuncs) {
      console.log('LOAD_MUTATIONS_POST', {mutationsStringFuncs})
      var mutationsFuncs = {}
      for (var i in mutationsStringFuncs)eval('mutationsFuncs[i] = ' + mutationsStringFuncs[i])
      console.log('LOAD_MUTATIONS_POST', {mutationsFuncs})
      state.postsMutations = mutationsFuncs
    },
    APPLY_MUTATIONS_POST (state, {mutations, mutationsFuncs}) {
      mutations.forEach(function (mutation, index) {
        console.log('APPLY_MUTATIONS_POST', {mutationsFuncs})
        var mutationsFunc = mutationsFuncs[mutation.mutation + '.' + mutation.version + '.js']
        var itemState = state.postsById[mutation.objId] || {}
        var resultState = mutationsFunc(itemState, mutation.data)
        Vue.set(state.postsById, mutation.objId, resultState)
        console.log('APPLY_MUTATIONS_POST', {mutation, mutationsFunc})
      })
    }
  },
  actions: {
    backEndMutation (store, payload) {
      console.log('backEndMutation', {payload})
      if (payload.entity === 'post') {
        if (!store.state.postsMutations) {
          call('dashboards', 'postsExportMutations', {}, (response) => {
            store.commit('LOAD_MUTATIONS_POST', response)
            store.commit('APPLY_MUTATIONS_POST', {mutations: payload.mutations, mutationsFuncs: store.state.postsMutations})
          })
        } else store.commit('APPLY_MUTATIONS_POST', {mutations: payload.mutations, mutationsFuncs: store.state.postsMutations})
      }
    },
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
      call('dashboards', 'subscriptionsGetExtendedByUserId', {}, (payload) => {
        store.commit('USER_SUBSCRIPTIONS', payload)
        // store.rootState.mainVue.$emit('USER_SUBSCRIPTIONS')
      })
    },
    postsConfirm (store, postId) {
      call('dashboards', 'postsConfirm', {id: postId}, (response) => {
        store.commit('POST_CONFIRMED', postId)
      })
    },
    postsCreate (store, payload) {
      store.dispatch('users/createGuest', {
        guest: payload.guest,
        onError: payload.onError,
        onSuccess: function (guestUserId) {
          payload.post.userId = guestUserId
          call('dashboards', 'postsCreate', payload.post, (response) => {
            store.commit('CREATE_POST', response.data)
            payload.onSuccess()
          }, payload.onError)
        }
      }, {root: true})
      // if (!store.state.users.logged) {
      //   call('users', 'createGuest', payload.guest, function () {
      //     call('dashboards', 'postsCreate', payload.post, (payload) => {
      //       store.commit('CREATE_POST', payload)
      //       payload.succ()
      //     }, payload.err)
      //   }, payload.err)
      // } else {
      //   call('dashboards', 'postsCreate', payload.post, (payload) => {
      //     store.commit('CREATE_POST', payload)
      //     payload.succ()
      //   }, payload.err)
      // }
    },
    // subscriptionsReadMultiple (store, payload) {
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
    //   console.log('subscriptionsReadMultiple', {ids})
    //   if (ids.length) {
    //     call('dashboards', 'subscriptionsReadMultiple', {ids}, (response) => {
    //       console.log('subscriptionsReadMultiple response', response)
    //       store.commit('SUBSCRIPTIONS_LOADED', response)
    //     })
    //   }
    // },
    lastDashboards (store, payload) {
      call('dashboards', 'listLastDashboards', {from: 0, to: pageLength}, (list) => store.commit('LAST_DASHBOARDS', {list, reset: true}))
    },
    loadDashboard (store, {dashId, force}) {
      if (!store.state.dashboardsById[dashId] || force)call('dashboards', 'read', {id: dashId}, (dashboard) => store.commit('LOAD_DASHBOARD', dashboard))
    },
    loadPost (store, {postId, force}) {
      if (!store.state.postsById[postId] || force)call('dashboards', 'postsRead', {id: postId}, (post) => store.commit('LOAD_POST', post))
    },
    loadSubscription (store, {subscriptionId, force}) {
      if (!store.state.subscriptionsById[subscriptionId] || force)call('dashboards', 'subscriptionsRead', {id: subscriptionId}, (subscription) => store.commit('LOAD_SUBSCRIPTION', subscription))
    },
    lastDashboardsLoadMore (store, payload) {
      call('dashboards', 'listLastDashboards', {from: store.state.lastDashboards.length, to: store.state.lastDashboards.length + pageLength}, (list) => store.commit('LAST_DASHBOARDS', {list, reset: false}))
    },
    lastDashboardPosts (store, payload) {
      store.commit('DASHBOARD_POSTS_LIST', {dashId: payload.dashId, status: 'loading'})
      call('dashboards', 'postsListLast', {dashId: payload.dashId, from: 0, to: pageLength}, (list) => {
        store.commit('DASHBOARD_POSTS_LIST', {dashId: payload.dashId, status: 'ready', add: list, reset: true})
      })
    },
    lastDashboardPostsLoadMore (store, payload) {
      store.commit('DASHBOARD_POSTS_LIST', {dashId: payload.dashId, status: 'loading'})
      call('dashboards', 'postsListLast', {from: store.state.dashboardsPostsList[payload.dashId].items.length, to: store.state.dashboardsPostsList[payload.dashId].items.length + pageLength, dashId: payload.dashId}, (list) => {
        store.commit('DASHBOARD_POSTS_LIST', {add: list, status: 'ready', dashId: payload.dashId})
      })
    },
    lastDashboardSubscriptions (store, payload) {
      store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {dashId: payload.dashId, status: 'loading'})
      call('dashboards', 'subscriptionsListLast', {dashId: payload.dashId, from: 0, to: pageLength}, (list) => {
        store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {dashId: payload.dashId, status: 'ready', add: list, reset: true})
      })
    },
    lastDashboardSubscriptionsLoadMore (store, payload) {
      store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {dashId: payload.dashId, status: 'loading'})
      call('dashboards', 'subscriptionsListLast', {from: store.state.dashboardsSubscriptionsList[payload.dashId].items.length, to: store.state.dashboardsSubscriptionsList[payload.dashId].items.length + pageLength, dashId: payload.dashId}, (list) => {
        store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {add: list, status: 'ready', dashId: payload.dashId})
      })
    },
    // lastDashboardSubscriptions (store, payload) {
    //   call('dashboards', 'subscriptionsListLast', {from: 0, to: pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId, reset: true}))
    // },
    // lastDashboardSubscriptionsLoadMore (store, payload) {
    //   call('dashboards', 'subscriptionsListLast', {from: store.state.dashboardsSubscriptionsListCount[payload.dashId], to: store.state.dashboardsSubscriptionsListCount[payload.dashId] + pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId}))
    // },
    subscribe (store, payload) {
      call('dashboards', 'subscriptionsCreate', payload, (payload) => store.dispatch('getUserSubscriptions', {}))
      // call('dashboards', 'subscriptionsListLast', {from: store.state.dashboardsSubscriptionsListCount[payload.dashId], to: store.state.dashboardsSubscriptionsListCount[payload.dashId] + pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId}))
    },
    unsubscribe (store, payload) {
      var subscription = store.state.userSubscriptionsByDashboardId[payload.dashId]
      call('dashboards', 'subscriptionsRemove', {id: subscription.id}, (payload) => store.dispatch('getUserSubscriptions', {}))
      // call('dashboards', 'subscriptionsListLast', {from: store.state.dashboardsSubscriptionsListCount[payload.dashId], to: store.state.dashboardsSubscriptionsListCount[payload.dashId] + pageLength, dashId: payload.dashId}, (list) => store.commit('DASHBOARD_SUBSCRIPTIONS_LIST', {list, dashId: payload.dashId}))
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
  },
  getters: {
    can: (state, getters) => (dashId, permission) => {
      var dashboard = state.dashboardsById[dashId]
      var subscription = state.userSubscriptionsByDashboardId[dashId] || {roleId: 'guest'}
      console.log('can', {dashId, permission, state, dashboard, subscription})
      if (dashboard) {
        var userRole = dashboard.roles[subscription.roleId]
        console.log('can userRole', {userRole})
        if (userRole && userRole.permissions) return userRole.permissions.indexOf(permission) + 1
      }
      return false
    },
    getRole: (state, getters) => (dashId, id) => {
      var dashboard = state.dashboardsById[dashId]
      return dashboard.roles[id]
    },
    getDashboard: (state, getters) => (id) => {
      return state.dashboardsById[id]
    },
    getPost: (state, getters) => (id) => {
      return state.postsById[id]
    },
    getSubscription: (state, getters) => (id) => {
      return state.subscriptionsById[id]
    },
    t: (state, getters) => (string) => translate('dashboards', string)
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

import {validate, call} from '@/api'
import Vue from 'vue'
import * as Cookies from 'js-cookie'
import {translate} from '@/i18n'

const mapboxgl = require('mapbox-gl')

var initState = {
  views: {},
  rpcServiceInfo: null,
  queries: {},
  dashboardsMaps: {},
  dashboardsMapsPoints: {}
}
var lsState
var serviceName = 'dashboards'
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
    RPC_MUTATION (state, payload) {},
    RPC_SERVICE_INFO (state, payload) {},
    RPC_QUERY (state, rpcServiceInfo) { state.rpcServiceInfo = rpcServiceInfo },
    CHANGE_DASHBOARD_RANDOM (state, {dashId, random}) { state.dashboardsById[dashId].random = random },
    SET_DASHBOARD_ACTIVE_MAP (state, {map, dashId}) {
      state.dashboardsMaps[dashId] = map
      console.log('SET_DASHBOARD_ACTIVE_MAP', {map, dashId})
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
    init (store) {
      call(serviceName, 'serviceInfo', {}, (response) => store.commit('RPC_SERVICE_INFO', response))
    },
    liveEventTrigger (store, event) {},
    rpcQuery (store, {api, data}) { call(serviceName, api, {from: 0, to: pageLength}, (response) => store.commit('RPC_QUERY', {response, reset: false})) },
    rpcMutation (store, {api, data}) { call(serviceName, api, data, (response) => store.commit('RPC_MUTATION', {response, reset: false})) },
    rpcQueryLoadMore (store, {api, data}) { call(serviceName, api, {from: store.state.queries[api].length, to: store.state.lastDashboards.length + pageLength}, (response) => store.commit('RPC_QUERY', {response, reset: false})) },
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
    getDashboard: (state, getters) => (id) => {
      return state.dashboardsById[id]
    },
    t: (state, getters) => (string) => translate('dashboards', string)
  }
}
export default storeModule

// import { getInitState, applyBeMutation, randomPassword } from './functions'
import Vue from 'vue'
import * as api from '@/api'
import { getToken, setToken } from '@/functions'
import { translate, toDate } from '@/translations'
import * as Cookies from 'js-cookie'

var serviceName = 'users'
// var apiServer = '/api'
// if (window.location.port === '8080' || window.location.port === 8080)apiServer = `https://0.0.0.0/api`
var apiServer = process.env.apiServer

var defaultState = {
  views: {},
  apiServiceInfo: null,
  queries: {},
  currentUser: {
    id: false,
    logged: false,
    isGuest: false,
    rememberMe: false
  }
}
var getState = () => {
  try {
    console.log('getState', JSON.parse(localStorage.getItem('cc_users')))
    var state = JSON.parse(localStorage.getItem('cc_users'))
    if (state.queries) for (var i in state.queries)state.queries[i].reload = true
    return state
  } catch (err) {
    return defaultState
  }
}
var getApiSchema = async (store, method) => {
  if (!storeModule.state.apiServiceInfo || !storeModule.state.apiServiceInfo.schema[method]) await store.dispatch('updateServiceInfo')
  return storeModule.state.apiServiceInfo.schema[method]
}
var getApiMutationFunc = async (store, mutation) => {
  var mutationId = mutation.mutation + '.' + mutation.version + '.js'
  if (!storeModule.state.apiServiceInfo || !storeModule.state.apiServiceInfo.mutations[mutationId]) await store.dispatch('updateServiceInfo')
  return storeModule.state.apiServiceInfo.mutations[mutationId]
}
var apiCall = async (store, { method, data, applyMutations = true, loadView = true }) => {
  var response = await api.httpRequest(apiServer + '/' + serviceName + '/' + method, data)
  console.log('apiCall', response)
  if (response.success) {
    if (loadView && response.view)store.commit('API_VIEW', {viewId: response.id, view: response.view})
    else if (applyMutations && response.mutations) {
      for (var i in response.mutations) {
        var mutationFunc = await getApiMutationFunc(store, response.mutations[i])
        store.commit('API_MUTATION', {id: response.id, mutation: response.mutations[i], mutationFunc})
      }
    }
    store.dispatch('saveSession')
  }
  return response
}
var storeModule = {
  namespaced: true,
  state: getState(),
  // plugins: [store => {
  //   console.log(' plugins', store)
  //   store.subscribe(mutation => {
  //     console.log(' JSON.stringify(store.state)', store.state, JSON.stringify(store.state))
  //     localStorage.setItem('cc_users', JSON.stringify(store.state))
  //   })
  // }],
  mutations: {
    RESET (state) { for (var i in defaultState) if (i !== 'apiServiceInfo')state[i] = defaultState[i] },
    API_QUERY (state, {queryId, query}) { Vue.set(state.queries, 'queryId', query) },
    API_VIEW (state, {viewId, view}) { Vue.set(state.views, 'viewId', view) },
    API_SERVICE_INFO (state, payload) {
      state.apiServiceInfo = payload
      for (var i in state.apiServiceInfo.mutations)eval('state.apiServiceInfo.mutations[i] = ' + state.apiServiceInfo.mutations[i])
    },
    API_MUTATION (state, {id, mutationFunc, mutation}) { state.views[id] = mutationFunc(state.views[id] || {id}, mutation.data) },
    LOGIN (state, payload) {
      console.log('LOGIN', payload)
      // Object.assign(state, currentState)
      Vue.set(state.currentUser, 'id', payload.id)
      Vue.set(state.logged, 'logged', true)
      Vue.set(state.rememberMe, 'rememberMe', payload.rememberMe || false)
      Cookies.set('civil-connect-token', payload.token)
    },
    LOGOUT (state) {
      console.log('LOGOUT')
      state.currentUser = defaultState.currentUser
      Cookies.remove('civil-connect-token')
    },
    RESET (state) {
      console.log('RESET')
      Object.assign(state, defaultState)
      Cookies.remove('civil-connect-token')
    }
  },
  actions: {
    async saveSession (store) {
      if (store.state.currentUser.rememberMe)localStorage.setItem('cc_users', JSON.stringify(store.state))
      console.log('saveSession', JSON.parse(localStorage.getItem('cc_users')))
    },
    apiCall,
    async apiQuery (store, { queryId, method, data = {} }) {
      console.log('apiQuery', { queryId, method, data })
      if (store.state.queries[queryId] && store.state.queries[queryId].results) {
        console.log('apiQuery from store', store.state.queries[queryId])
        if (!store.state.queries[queryId].reload) return store.state.queries[queryId]
        data.loadIfUpdatedAfter = store.state.queries[queryId].results.map((viewId) => store.state.views[viewId]).reduce((acc = store.state.queries[queryId].timestamp, item) => !item.VIEW_META || acc > item.VIEW_META.updated ? acc : item.VIEW_META.updated)
        store.state.queries[queryId].results.reduce((acc, item) => console.log('queries', item, acc))
        console.log('apiQuery updated', data)
      }
      var response = await api.httpRequest(apiServer + '/' + serviceName + '/' + method, data)
      console.log('apiQuery response', response)
      var query = {
        id: queryId,
        timestamp: response.timestamp,
        success: response.success
      }
      query.results = response.results.map((result) => { if (typeof result === 'object') { store.commit('API_VIEW', {viewId: result.id, view: result}); return result.id } else return result })
      console.log('apiQuery query', query)
      // var query=response
      store.commit('API_QUERY', {queryId, query})
      // // console.log('apiQuery to store', store.state.queries[queryId])
      store.dispatch('saveSession')
      return query
    },
    async apiView (store, {viewId, fields = []}) {
      var view = store.state.views[viewId]
      if (view) {
        fields = fields.filter(x => !Object.keys(view).includes(x))
        if (fields.length === 0) {
          console.log('apiView from store', view)
          return {view: store.state.views[viewId]}
        }
      }
      console.log('apiView ', apiServer + '/' + serviceName + '/read', {id: viewId, fields})
      var response = await apiCall(store, { method: 'read', data: {id: viewId, fields} })
      console.log('apiView response', apiServer + '/' + serviceName + '/read', {response})
      return {view: store.state.views[viewId], response}
    },
    async apiValidate (store, { service, method, data, extraValidation, clear }) {
      var schema = await getApiSchema(store, method)
      return api.validate(schema, method, data, extraValidation, clear)
    },
    async updateServiceInfo (store) {
      store.commit('API_SERVICE_INFO', await api.httpRequest(apiServer + '/' + serviceName + '/serviceInfo'))
      store.dispatch('saveSession')
    },
    async refreshToken (store) {
      console.log('refreshToken', Cookies.get('civil-connect-token'))
      if (Cookies.get('civil-connect-token')) {
        var response = await apiCall(store, { method: 'refreshToken', data: {token: Cookies.get('civil-connect-token')}})
        console.log('refreshToken ', response)
        if (response.success) {
          Cookies.set('civil-connect-token', response.data.token)
        } else {
          store.commit('LOGOUT')
        }
        store.dispatch('saveSession')
      }
    },
    async login (store, payload) {
      console.log('login', payload)
      store.commit('LOGIN', payload)
      store.dispatch('saveSession')
    },
    async logout (store) {
      console.log('logout')
      store.commit('LOGOUT')
      store.dispatch('saveSession')
    },
    async reset (store) {
      console.log('reset')
      store.commit('RESET')
      store.dispatch('saveSession')
    },
    async init (store) {
      if (!store.state.apiServiceInfo) await store.dispatch('updateServiceInfo')
      if (!Cookies.get('civil-connect-token')) {
        store.commit('RESET')
        store.dispatch('saveSession')
      } else store.dispatch('refreshToken')
    }
  },
  getters: {
    t: (state, getters) => (string, number) => translate(serviceName, string, number),
    toDate: (state, getters) => (timestamp, format) => toDate(timestamp, format)
  }
}
export default storeModule

import {validate, call} from '@/api'
import Vue from 'vue'
import * as Cookies from 'js-cookie'
import {translate} from '@/i18n'
var pageLength = 20
var initState = {
  views: {},
  rpcServiceInfo: null,
  queries: {},
  currentUser: {
    id: false,
    logged: false,
    isGuest: false,
    random: '',
    token: false,
    rememberMe: true
  }
}
function randomPassword (length) {
  var chars = 'abcdefghijklmnopqrstuvwxyz#?!@$%^&*-ABCDEFGHIJKLMNOP1234567890'
  var charsLower = 'abcdefghijklmnopqrstuvwxyz'
  var charsUpper = 'ABCDEFGHIJKLMNOP'
  var charsNumbers = '1234567890'
  var pass = ''
  for (var x = 0; x < length; x++) {
    var i = Math.floor(Math.random() * chars.length)
    pass += chars.charAt(i)
  }
  pass += charsLower.charAt(Math.floor(Math.random() * charsLower.length))
  pass += charsUpper.charAt(Math.floor(Math.random() * charsUpper.length))
  pass += charsNumbers.charAt(Math.floor(Math.random() * charsNumbers.length))
  return pass
}

var serviceName = 'users'
var lsState = {}
if (localStorage && localStorage.getItem(serviceName)) lsState = JSON.parse(localStorage.getItem(serviceName))
// var token = Cookies.getJSON('civil-connect-token')
var storeModule = {
  namespaced: true,
  state: Object.assign({}, initState, lsState),
  mutations: {
    RPC_MUTATION (state, payload) {},
    RPC_SERVICE_INFO (state, payload) {
      console.log('RPC_SERVICE_INFO', payload)
      state.rpcServiceInfo = payload
      for (var i in state.rpcServiceInfo.mutations)eval('state.rpcServiceInfo.mutations[i] = ' + state.rpcServiceInfo.mutations[i])
    },
    RPC_QUERY (state, rpcServiceInfo) { state.rpcServiceInfo = rpcServiceInfo },
    RESET (state) { for (var i in initState) if (i !== 'rpcServiceInfo')state[i] = initState[i] },
    LOGIN (state, {token}) {
      state.currentUser.isGuest = false
      state.currentUser.token = token
      state.currentUser.logged = true
    },
    LOGOUT (state, response) {
      state.currentUser.isGuest = true
      state.currentUser.token = null
      state.currentUser.logged = false
    },
    EMAIL_CONFIRMED (state, {email}) {
      state.currentUser.email = email
      state.currentUser.emailConfirmed = true
    },
    REGISTERED (state, {email}) {
      state.currentUser.email = email
    }
  },
  actions: {
    async rpcCallAndStoreMutation (store, {rpcMethod, mutation, data = {}, success = () => true, error = () => true, multiToSingle = false}) {
      try {
        if (multiToSingle)data = {items: [data]}
        var rpcResp = await call({url: serviceName + '/' + rpcMethod, data})
        if (multiToSingle && data.results && data.results[0])rpcResp = data.results[0]
        store.commit(mutation, rpcResp)
        success(rpcResp)
        console.log('rpcCallAndStoreMutation', {rpcMethod, mutation, data, rpcResp})
      } catch (err) {
        console.log('rpcCallAndStoreMutation Error', err)
        error(err)
      }
    },
    async rpcCallAndMutation (store, {rpcMethod, data = {}, success = () => true, error = () => true, multiToSingle = false}) {
      try {
        console.log('rpcCallAndMutation ', {rpcMethod, data, success, error, multiToSingle})
        var schema = store.state.rpcServiceInfo.schema && store.state.rpcServiceInfo.schema[rpcMethod] ? store.state.rpcServiceInfo.schema[rpcMethod] : {}
        if (multiToSingle && schema.properties.items) schema = schema.properties.items.items
        var validation = validate(schema, data)
        console.log('rpcCallAndMutation validation', validation)
        if (!validation.valid) return error({type: 'validation', data: validation})
        var dataToSend = multiToSingle ? {items: [data]} : data
        var rpcResp = await call({url: serviceName + '/' + rpcMethod, data: dataToSend})
        console.log('rpcCallAndMutation rpcResp', rpcResp)
        // if (multiToSingle && rpcResp.results && rpcResp.results[0])rpcResp = rpcResp.results[0]
        if (rpcResp.__RESULT_TYPE__ === 'error') return error({ type: 'api', data: rpcResp })
        var results = rpcResp.results.map((result, index) => {
          var viewId = result.id || dataToSend[index].id
          if (!store.state.views[viewId])store.state.views[viewId] = {}
          var view = store.state.views[viewId]
          var mutationName = result.mutation + '.js'
          var mutation = store.state.rpcServiceInfo.mutations && store.state.rpcServiceInfo.mutations[mutationName] ? store.state.rpcServiceInfo.mutations[mutationName] : (state, data) => state
          console.log('rpcCallAndMutation view before mutation', {view, mutation})
          view = mutation(view, dataToSend.items[index])
          console.log('rpcCallAndMutation view after mutation', {view, data: dataToSend.items[index]})
          return view
        })
        return success(multiToSingle ? results[0] : results)
      } catch (err) {
        err.__ERROR__ = true
        console.log('rpcCallAndStoreMutation Error', err)
        error(err)
      }
    },
    rpcQuery (store, {api, data}) { call(serviceName, api, {from: 0, to: pageLength}, (response) => store.commit('RPC_QUERY', {response, reset: false})) },
    rpcQueryLoadMore (store, {api, data}) { call(serviceName, api, {from: store.state.queries[api].length, to: store.state.lastDashboards.length + pageLength}, (response) => store.commit('RPC_QUERY', {response, reset: false})) },
    async init (store) {
      var serviceInfo = await call({url: serviceName + '/serviceInfo', data: {}})
      console.log('serviceInfo', serviceInfo)
      store.commit('RPC_SERVICE_INFO', serviceInfo)
      store.commit('ADD_EVENTS_LISTENER', () => { console.log('event listener') }, {root: true})
      if (typeof store.state.currentUser.token !== 'string')store.commit('RESET')
      if (store.state.currentUser.logged) {
        try {
          var rpcResp = await call({url: serviceName + '/refreshToken', data: {token: store.state.currentUser.token}})
          store.commit('LOGIN', rpcResp)
          store.rootState.mainVue.$emit('login')
          store.dispatch('mountLiveEvents', {root: true})
        } catch (err) {
          store.commit('LOGOUT')
        }
      }
    },
    liveEventTrigger (store, event) {},
    login (store, payload) {
      store.commit('LOGIN', payload)
      var options = store.state.currentUser.rememberMe ? {expires: 5} : {}
      Cookies.set('civil-connect-token', store.state.currentUser.token, options)
      store.rootState.mainVue.$emit('login')
      store.dispatch('saveToLocalStorage', payload)
    },
    logout (store, payload) {
      store.commit('LOGOUT', payload)
      Cookies.remove('civil-connect-token')
      store.rootState.mainVue.$emit('logout')
      store.dispatch('saveToLocalStorage', payload)
    },
    saveToLocalStorage (store, payload) {
      var temp = store.state.currentUser.token
      delete store.state.currentUser.token
      localStorage.setItem(serviceName, JSON.stringify(store.state))
      store.state.currentUser.token = temp
    },
    createGuest (store, payload) {
      const callApi = function (position) {
        if (position) {
          payload.guest.info.position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.coords.timestamp
          }
        }
        payload.guest.info = JSON.parse(JSON.stringify(payload.guest.info))
        console.log('action createGuest', payload)
        call('users', 'createGuest', payload.guest, (response) => {
          console.log('call createGuest response', response)
          store.dispatch('update', {mutation: 'CREATE_GUEST', payload: response})
          payload.onSuccess(response.id)
        }, function (msg, extra) {
          console.log('call createGuest error', msg, extra)
          payload.onError(msg, extra)
        })
      }
      if (store.state.logged) return payload.onSuccess(store.state.id)
      store.state.guestPassword = randomPassword(20)
      payload.guest.password = store.state.guestPassword
      payload.guest.info = {
        timeOpened: new Date(),
        timezone: (new Date()).getTimezoneOffset() / 60,
        location: window.location,
        referrer: document.referrer,
        cookie: document.cookie,
        navigator: {
          browserName: navigator.appName,
          browserEngine: navigator.product,
          browserVersion1a: navigator.appVersion,
          browserVersion1b: navigator.userAgent,
          browserLanguage: navigator.language,
          browserOnline: navigator.onLine,
          browserPlatform: navigator.platform,
          javaEnabled: navigator.javaEnabled()
        },
        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth
        },
        sizeDocW: document.width,
        sizeDocH: document.height,
        innerWidth,
        innerHeight
      }
      if (navigator.geolocation) navigator.geolocation.getCurrentPosition(callApi)
      else callApi(null)
    }

  },
  getters: {
    rpcValidate: (state, getters) => ({rpcMethod, data, multiToSingle = false}) => {
      console.log('rpcValidate', {rpcMethod, data, schema: state.rpcServiceInfo.schema[rpcMethod]})
      var schema = state.rpcServiceInfo.schema && state.rpcServiceInfo.schema[rpcMethod] ? state.rpcServiceInfo.schema[rpcMethod] : {}
      console.log('rpcValidate schema', schema)
      if (multiToSingle && schema.properties.items) schema = schema.properties.items.items
      var result = validate(schema, data)
      console.log('rpcValidate result', result)
      return result
    },
    getDashboard: (state, getters) => (id) => {
      return state.dashboardsById[id]
    },
    t: (state, getters) => (string) => translate('dashboards', string)
  }
}
export default storeModule

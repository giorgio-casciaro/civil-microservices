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
function applyMutation (store, viewId, mutationName, mutationData) {
  // var viewId = result.id || dataToSend[index].id
  // console.log('rpcCallAndMutation viewId', {viewId})
  if (!store.state.views[viewId])store.state.views[viewId] = {}
  var view = store.state.views[viewId]
  var mutationNameWithExt = mutationName + '.js'
  var mutation = store.state.rpcServiceInfo.mutations && store.state.rpcServiceInfo.mutations[mutationNameWithExt] ? store.state.rpcServiceInfo.mutations[mutationNameWithExt] : (state, data) => state
  console.log('rpcCallAndMutation view before mutation', {viewId, mutationName, view, mutation})
  view = mutation(view, mutationData)
  console.log('rpcCallAndMutation view after mutation', {view, mutationData, mutation})
  return view
}

var serviceName = 'users'
var cookieToken = Cookies.getJSON('civil-connect-token')
var serviceLocalStorage = localStorage.getItem(serviceName)

var lsState = {}
if (localStorage && serviceLocalStorage) lsState = JSON.parse(serviceLocalStorage)
if (cookieToken) {
  if (lsState.currentUser)lsState.currentUser.token = cookieToken
  else initState.currentUser.token = cookieToken
}
console.log('serviceLocalStorage', {lsState, cookieToken})
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
    LOGIN (state, {token, currentState}) {
      state.currentUser.isGuest = false
      state.currentUser.token = token
      state.currentUser.logged = true
      if (currentState) {
        state.currentUser.currentState = currentState
        state.currentUser.id = currentState.id
        state.currentUser.email = currentState.email
      }
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
        var errors = false
        if (rpcResp.errors) {
          errors = rpcResp.results.filter(result => result.__RESULT_TYPE__ === 'error')
          if (errors.length)error(multiToSingle ? errors[0] : errors)
        }
        var results = rpcResp.results.filter(result => result.__RESULT_TYPE__ !== 'error')
        // if (multiToSingle && rpcResp.results && rpcResp.results[0]) {
        //   rpcResp = rpcResp.results[0]
        // }
        console.log('rpcCallAndStoreMutation 1', {rpcMethod, mutation, data, rpcResp, multiToSingle})
        if (rpcResp.__RESULT_TYPE__ === 'error' || rpcResp.errors) throw new Error(rpcResp)
        results.forEach(result => store.commit(mutation, result))
        console.log('rpcCallAndStoreMutation', {rpcMethod, mutation, data, rpcResp})
        return success(multiToSingle ? results[0] : results)
      } catch (err) {
        console.log('rpcCallAndStoreMutation Error', err)
        error(err)
      }
    },
    async rpcCallAndMutation (store, {rpcMethod, data = {}, success = () => true, error = () => true, multiToSingle = false, single = false}) {
      try {
        console.log('rpcCallAndMutation ', {state: store.state, rpcMethod, data, success, error, multiToSingle, single})
        var schema = store.state.rpcServiceInfo && store.state.rpcServiceInfo.schema && store.state.rpcServiceInfo.schema[rpcMethod] ? store.state.rpcServiceInfo.schema[rpcMethod] : {}
        if (multiToSingle && schema.properties.items) schema = schema.properties.items.items
        var validation = validate(schema, data)
        console.log('rpcCallAndMutation validation', validation)
        if (!validation.valid) return error(validation)
        var dataToSend = !single && multiToSingle ? {items: [data]} : data
        console.log('rpcCallAndMutation dataToSend', dataToSend)
        var rpcResp = await call({url: serviceName + '/' + rpcMethod, data: dataToSend})
        console.log('rpcCallAndMutation rpcResp', rpcResp)
        var errors = false
        if (rpcResp.errors) { errors = rpcResp.results.filter(result => result.__RESULT_TYPE__ === 'error') } else if (rpcResp.error) { errors = [rpcResp] }
        if (errors.length)error(multiToSingle ? errors[0] : errors)
        var resultsToProcess = rpcResp.results
        if (single)resultsToProcess = [rpcResp]
        if (!resultsToProcess) return false
        console.log('rpcCallAndMutation resultsToProcess', resultsToProcess)
        var results = resultsToProcess.filter(result => result.__RESULT_TYPE__ !== 'error').map((result, index) => {
          var viewId = result.id || dataToSend[index].id
          console.log('rpcCallAndMutation viewId', {viewId})
          if (!store.state.views[viewId])store.state.views[viewId] = {}
          var view = store.state.views[viewId]
          var mutationName = result.mutation + '.js'
          var mutation = store.state.rpcServiceInfo.mutations && store.state.rpcServiceInfo.mutations[mutationName] ? store.state.rpcServiceInfo.mutations[mutationName] : (state, data) => state
          console.log('rpcCallAndMutation view before mutation', {single, multiToSingle, dataToSend, view, mutation})
          var mutationData = !single ? dataToSend.items[index] : dataToSend
          view = mutation(view, mutationData)
          console.log('rpcCallAndMutation view after mutation', {view, mutationData, mutation})
          return view
        })
        if (results.length) return success(multiToSingle ? results[0] : results)
      } catch (err) {
        err.__RESULT_TYPE__ = 'error'
        console.log('rpcCallAndStoreMutation Error', err)
        error(err)
      }
    },
    async rpcCallAndMutationSingle (store, {rpcMethod, data = {}, success = () => true, error = () => true}) {
      try {
        console.log('rpcCallAndMutationSingle ', {state: store.state, rpcMethod, data, success, error})
        var schema = store.state.rpcServiceInfo && store.state.rpcServiceInfo.schema && store.state.rpcServiceInfo.schema[rpcMethod] ? store.state.rpcServiceInfo.schema[rpcMethod] : {}
        var validation = validate(schema, data)
        if (!validation.valid) return error(validation)
        var dataToSend = data
        var rpcResp = await call({url: serviceName + '/' + rpcMethod, data: dataToSend})
        if (rpcResp.__RESULT_TYPE__ === 'error') return error(rpcResp)
        var viewId = rpcResp.id || dataToSend.id
        var view = applyMutation(store, viewId, rpcResp.mutation + '.js', dataToSend)
        return success([view])
      } catch (err) {
        err.__RESULT_TYPE__ = 'error'
        console.log('rpcCallAndStoreMutation Error', err)
        error(err)
      }
    },
    async rpcCallAndStoreMutationSingle (store, {rpcMethod, mutation, data = {}, success = () => true, error = () => true}) {
      var rpcResp = await call({url: serviceName + '/' + rpcMethod, data})
      if (rpcResp.__RESULT_TYPE__ === 'error') return error(rpcResp)
      store.commit(mutation, rpcResp)
      return success(rpcResp)
    },
    async rpcCallAndStoreActionSingle (store, {rpcMethod, action, data = {}, success = () => true, error = () => true}) {
      var rpcResp = await call({url: serviceName + '/' + rpcMethod, data})
      if (rpcResp.__RESULT_TYPE__ === 'error') return error(rpcResp)
      store.dispatch(action, rpcResp)
      return success(rpcResp)
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
          store.dispatch('mountLiveEvents', {}, {root: true})
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
      store.dispatch('saveToLocalStorage')
    },
    logout (store, payload) {
      store.commit('LOGOUT', payload)
      Cookies.remove('civil-connect-token')
      store.rootState.mainVue.$emit('logout')
      store.dispatch('saveToLocalStorage')
    },
    saveToLocalStorage (store) {
      var temp = store.state.currentUser.token
      delete store.state.currentUser.token
      localStorage.setItem(serviceName, JSON.stringify(store.state))
      console.log('saveToLocalStorage', localStorage.getItem(serviceName))
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
      console.log('rpcValidate', {rpcMethod, data, schema: state})
      var schema = state.rpcServiceInfo && state.rpcServiceInfo.schema && state.rpcServiceInfo.schema[rpcMethod] ? state.rpcServiceInfo.schema[rpcMethod] : {}
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

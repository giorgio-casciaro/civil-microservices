import {validate, call} from '@/api'
import Vue from 'vue'
import * as Cookies from 'js-cookie'
import {translate} from '@/translations'

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

var initState = {
  id: false,
  logged: false,
  isGuest: false,
  email: false,
  random: '',
  emailConfirmationCode: '',
  tags: [],
  token: false,
  hasPic: false,
  emailConfirmed: false,
  guestPassword: false,
  passwordAssigned: false,
  rememberMe: false,
  publicName: false,
  notificationsList: false,
  notificationsById: {},
  usersById: {}
}
if (localStorage && localStorage.getItem('userState')) {
  var lsState = JSON.parse(localStorage.getItem('userState'))
}
var token = Cookies.getJSON('civil-connect-token')

export default {
  namespaced: true,
  state: Object.assign({}, initState, lsState, {token}),
  mutations: {
    LOGGEDIN (state, {token, rememberMe, currentState}) {
      Object.assign(state, currentState)
      state.isGuest = false
      state.token = token
      state.rememberMe = rememberMe
      state.logged = true
    },
    SET_TOKEN (state, response) {
      state.token = response.token
    },
    LOGGEDOUT (state, response) {
      // Object.assign(state, initState)
      // state = initState
      for (var i in initState)state[i] = initState[i]
      console.log('LOGGEDOUT', state, response, initState)
    },
    EXPIRED_TOKEN (state, response) {
      for (var i in initState)state[i] = initState[i]
      console.log('LOGGEDOUT', state, response, initState)
    },
    REGISTERED (state, {email}) {
      state.email = email
    },
    EMAIL_CONFIRMED (state, {email}) {
      state.email = email
      state.emailConfirmed = true
    },
    PASSWORD_ASSIGNED (state) {
      state.passwordAssigned = true
    },
    PIC_UPDATED (state) {
      state.hasPic = true
    },
    CHANGE_RANDOM (state, random) {
      state.random = random
    },
    PUBLICNAME_UPDATED (state, {publicName}) {
      state.publicName = publicName
    },
    PERSONAL_INFO_UPDATED (state, {firstName, lastName, birth}) {
      Object.assign(state, {firstName, lastName, birth})
    },
    USERS_LOADED (state, list) {
      console.log('USERS_LOADED', list)
      if (!state.usersById)state.usersById = {}
      list.forEach((user) => {
        Vue.set(state.usersById, user.id, user)
      })
    },
    CREATE_GUEST (state, payload) {
      console.log('CREATE_GUEST', payload)
      Object.assign(state, payload.currentState)
      state.token = payload.token
      state.rememberMe = true
      state.logged = true
      state.isGuest = true
    },
    NOTIFICATIONS_LIST (state, payload) {
      var dataState = state.notificationsList
      if (payload.reset || !dataState) dataState = {status: 'loading', items: []}
      if (payload.status) dataState.status = payload.status
      if (payload.add) {
        if (payload.addBefore)dataState.items = payload.add.map((notification) => notification.id).concat(dataState.items)
        else dataState.items = dataState.items.concat(payload.add.map((notification) => notification.id))
        payload.add.forEach((notification) => Vue.set(state.notificationsById, notification.id, notification))
      }
      Vue.set(state, 'notificationsList', dataState)
      console.log('DASHBOARD_POSTS_LIST', payload, dataState, state.notificationsList)
    }
  },
  actions: {
    backEndEvent (store, payload) {
      console.log('backEndEvent', {payload})
      if (payload.entity === 'notification' && payload.type === 'created') {
        store.commit('NOTIFICATIONS_LIST', {add: [payload.data], addBefore: true})
      }
    },
    mountLiveEvents (store) {
      console.log('mountLiveEvents')
      if (store.es) return false
      store.es = new EventSource('https://127.0.0.1/liveevents/getUserEvents/token/' + store.state.token)
      store.es.addEventListener('message', event => {
        let data = JSON.parse(event.data)
        console.log('EventSource message', event.data, event)
        console.log('EventSource parsed data', data)
        store.dispatch('backEndEvent', data)
        // this.stockData = data.stockData
      }, false)
      store.es.addEventListener('open', event => {
        console.log('EventSource open', event.data, event)
        // let data = JSON.parse(event.data)
        // this.stockData = data.stockData
      }, false)
      store.es.addEventListener('error', event => {
        if (event.readyState === EventSource.CLOSED) {
          console.log('EventSource error', event.data, event)
        }
      }, false)
    },
    init (store) {
      if (typeof store.state.token !== 'string')store.dispatch('update', { mutation: 'LOGGEDOUT', payload: {} })
      if (store.state.logged) {
        call('users', 'refreshToken', {token: store.state.token}, (payload) => {
          store.dispatch('update', {mutation: 'SET_TOKEN', payload})
          store.rootState.mainVue.$emit('login')
          store.dispatch('mountLiveEvents')
        }, (payload) => store.dispatch('update', {mutation: 'EXPIRED_TOKEN', payload}))
      }
    },
    login (store, payload) {
      store.dispatch('update', {mutation: 'LOGGEDIN', payload})
      store.rootState.mainVue.$emit('login')
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
    },
    update (store, {mutation, payload}) {
      store.commit(mutation, payload)
      if (store.state.token) {
        var options = {}
        if (store.state.rememberMe)options.expires = 5
        Cookies.set('civil-connect-token', store.state.token, options)
      }
      if (store.state.rememberMe) {
        var temp = store.state.token
        delete store.state.token
        localStorage.setItem('userState', JSON.stringify(store.state))
        store.state.token = temp
      }
    },
    readUsers (store, payload) {
      var id
      var ids = []
      if (!payload.refresh) {
        for (var i = 0; i < payload.ids.length; i++) {
          id = payload.ids[i]
          if (store.state.usersById && !store.state.usersById[id])ids.push(id)
        }
      } else {
        ids = payload.ids
      }
      console.log('subscriptionsReadMultiple', {ids})
      if (ids.length) {
        call('users', 'readUsers', {ids: payload.ids}, (response) => {
          store.commit('USERS_LOADED', response)
        })
      }
    },
    logout (store, apiResponse) {
      // store.commit('LOGGEDOUT', apiResponse)
      store.dispatch('update', {mutation: 'LOGGEDOUT', apiResponse})
      Cookies.remove('civil-connect-token')
      localStorage.removeItem('userState')
      store.rootState.mainVue.$emit('logout')
    },
    notificationsLoad (store, payload) {
      store.commit('NOTIFICATIONS_LIST', { status: 'loading' })
      call('users', 'notificationsLastsByUserId', { from: 0, to: 30 }, (list) => {
        store.commit('NOTIFICATIONS_LIST', { status: 'ready', add: list, reset: true })
      })
    },
    notificationsLoadMore (store, payload) {
      store.commit('NOTIFICATIONS_LIST', {status: 'loading'})
      call('users', 'notificationsLastsByUserId', {from: store.state.notificationsList.items.length, to: store.state.notificationsList.items.length + 30}, (list) => {
        store.commit('NOTIFICATIONS_LIST', {add: list, status: 'ready'})
      })
    },
    notificationLoad (store, {notificationId, force}) {
      if (!store.state.notificationsById[notificationId] || force)call('users', 'notificationsRead', {id: notificationId}, (notification) => store.commit('LOAD_NOTIFICATION', notification))
    }
  },
  getters: {
    notificationGet: (state, getters) => (id) => {
      return state.notificationsById[id]
    },
    t: (state, getters) => (string) => translate('users', string)
  }
}
//
// const httpApiPost = (url, request, mutation, filterResponse = (x) => x, errorMutation = 'APP_ERROR') => {
//   console.log('httpApiPost', url, request)
//   // Vue.http.post(url, request)
//   // .then(response => response.error ? store.commit(errorMutation, { type: 'login', error: response }) : store.commit(mutation, filterResponse(response)))
//   // .catch(error => store.commit(errorMutation, {type: 'httpPost', url, request, error}))
// }
// const getUrl = (server, service, method) => server + '/' + service + '/' + method

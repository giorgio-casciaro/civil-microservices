import {validate, call} from '@/api'
import Vue from 'vue'
import * as Cookies from 'js-cookie'
import {translate} from '@/i18n'
import Vuex from 'vuex'
import * as moment from 'moment'

// import createPersistedState from 'vuex-persistedstate'
Vue.use(Vuex)

// if (process.env.NODE_ENV === 'development')apiServer = 'http://localhost:81/api'
// else if (process.env.NODE_ENV === 'test')apiServer = 'http://localhost:81/api'
// else if (process.env.NODE_ENV === 'production')apiServer = 'http://localhost:81/api'

const store = new Vuex.Store({
  state: {
    viewport: 'main',
    eventsListeners: {},
    errors: []
  },
  mutations: {
    ADD_EVENTS_LISTENER (state, listener) { state.eventsListeners[listener.name] = listener.func },
    OPEN_VIEWPORT (state, viewport) {
      if (viewport === state.viewport === 'main') return false
      if (viewport === state.viewport) return (state.viewport = 'main')
      state.viewport = viewport
    },
    CLOSE_VIEWPORT (state) {
      state.viewport = 'main'
    },
    MAIN_VUE (state, Vue) {
      state.mainVue = Vue
    },
    ERROR (state, error) {
      state.errors.push(error)
    }
  },
  actions: {
    backEndEvent: (store, event) => { for (var func in store.state.eventsListeners) func(event) },
    mountLiveEvents: (store) => {
      console.log('mountLiveEvents')
      if (store.es) return false
      store.es = new EventSource('https://127.0.0.1/liveevents/getEvents/', { withCredentials: true })
      store.es.addEventListener('message', event => {
        let data = JSON.parse(event.data)
        console.log('EventSource message', event.data, event)
        console.log('EventSource parsed data', data)
        store.commit('backEndEvent', data)
      }, false)
      store.es.addEventListener('open', event => { console.log('EventSource open', event.data, event) }, false)
      store.es.addEventListener('error', event => { if (event.readyState === EventSource.CLOSED) console.log('EventSource error', event.data, event) }, false)
    }
  },
  getters: {
    toDate: (state, getters) => (timestamp, format) => {
      moment.locale('it')
      return moment(parseInt(timestamp)).format(format || 'dddd, D MMMM YYYY, h:m:s')
    },
    t: (state, getters) => (string) => translate('pages', string)

  }
})
// const httpApiPost = (service, method, request, mutation, filterResponse = (x) => x, errorMutation = 'APP_ERROR') => {
//   var url = config.server + '/' + service + '/' + method
//   console.log('httpApiPost', url, request)
//   Vue.http.post(url, request)
//   .then(response => response.error ? store.commit(errorMutation, { type: 'login', error: response }) : store.commit(mutation, filterResponse(response)))
//   .catch(error => store.commit(errorMutation, {type: 'httpPost', url, request, error}))
// }
export default store

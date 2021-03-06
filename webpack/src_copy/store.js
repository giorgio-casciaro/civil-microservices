import Vue from 'vue'
import Vuex from 'vuex'
import * as moment from 'moment'

// import createPersistedState from 'vuex-persistedstate'
Vue.use(Vuex)
var apiServer = '/api'
if (window.location.port == 8080)apiServer = `https://${window.location.hostname}/api`

// if (process.env.NODE_ENV === 'development')apiServer = 'http://localhost:81/api'
// else if (process.env.NODE_ENV === 'test')apiServer = 'http://localhost:81/api'
// else if (process.env.NODE_ENV === 'production')apiServer = 'http://localhost:81/api'
const store = new Vuex.Store({
  state: {
    apiServer: apiServer,
    viewport: 'main',
    errors: []
  },
  // plugins: [createPersistedState()],
  mutations: {
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
  getters: {
    toDate: (state, getters) => (timestamp, format) => {
      moment.locale('it')
      return moment(parseInt(timestamp)).format(format || 'dddd, D MMMM YYYY, h:m:s')
    }

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

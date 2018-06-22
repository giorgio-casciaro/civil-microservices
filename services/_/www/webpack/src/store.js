import {
  validate,
  call
} from '@/api'
import Vue from 'vue'
import * as Cookies from 'js-cookie'
import {
  translate,
  toDate
} from '@/translations'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    viewport: 'main'
  },
  plugins: [store => {
    store.subscribe(async (mutation, state) => {
      console.log(' plugins', mutation.type.split('/')[0], store)
      try {
        var actionName = mutation.type.split('/')[0] + '/onMutation'
        if (store._actions[actionName]) await store.dispatch(actionName, store)
      } catch (err) { }
    })
  }],
  mutations: {
    VIEWPORT (state, viewport) {
      state.viewport = viewport
    }
  },
  actions: {},
  getters: {
    t: (state, getters) => (string, number) => translate('app', string, number),
    toDate: (state, getters) => (timestamp, format) => toDate(timestamp, format)
  }
})

export default store

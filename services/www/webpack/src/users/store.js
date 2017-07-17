
  import * as Cookies from 'js-cookie'
  var initState = {
    id: false,
    logged: false,
    email: false,
    random: '',
    token: false,
    hasPic: false,
    emailConfirmed: false,
    passwordAssigned: false,
    rememberMe: false,
    publicName: false
  }
  if (localStorage && localStorage.getItem('userState')) {
    var lsState = JSON.parse(localStorage.getItem('userState'))
  }
  var token = Cookies.getJSON('civil-connect-token')

  export default {
    namespaced: true,
    state: Object.assign({}, lsState || initState, {token}),
    mutations: {
      LOGGEDIN (state, {token, rememberMe, currentState}) {
        Object.assign(state, currentState)
        state.token = token
        state.rememberMe = rememberMe
        state.logged = true
      },
      SET_TOKEN (state, token) {
        state.token = token
      },
      LOGGEDOUT (state, response) {
        Object.assign(state, initState)
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
      CHANGE_RANDOM (state,random) {
        state.random = random
      },
      PUBLICNAME_UPDATED (state, {publicName}) {
        state.publicName = publicName
      },
      PERSONAL_INFO_UPDATED (state, {firstName, lastName, birth}) {
        Object.assign(state, {firstName, lastName, birth})
      }
    },
    actions: {
      login (store, payload) {
        store.dispatch('update', {mutation: 'LOGGEDIN', payload})
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
      logout (store, apiResponse) {
        store.commit('LOGGEDOUT', apiResponse)
        Cookies.remove('civil-connect-token')
        localStorage.removeItem('userState')
      }
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

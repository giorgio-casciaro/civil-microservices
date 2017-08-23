export default {
  namespaced: true,
  state: {
  },
  mutations: {
    LOGGEDIN (state, {email, token, id}) {
      state.logged = true
      state.email = email
      state.token = token
      state.id = id
    }
  }
    // actions: {
    //   login (store, request) {
    //   // httpApiPost('admin', 'getSchema', request, 'USER_LOGIN', (response) => { console.log('response', response); return response })
    //     var afterLogin = (response) => { console.log('response', response); return response }
    //     var url = getUrl(config.apiServer, 'users', 'login')
    //     httpApiPost(url, request, 'LOGIN', afterLogin)
    //   },
    //   register (store, request) {
    //     httpApiPost('users', 'create', request, 'REGISTER', (response) => { console.log('response', response); return response })
    //   }
    // }
}

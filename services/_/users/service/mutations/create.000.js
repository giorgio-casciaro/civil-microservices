module.exports = function (state, data) {
  // state.status = 0
  state.publicName = data.publicName || data.email.split('@')[0]
  state.passwordStatus = 0
  state.logins = 0
  state.logouts = 0
  state.id = data.id
  state.email = data.email
  state.emailConfirmationCode = data.emailConfirmationCode
  state.emailStatus = 0
  return state
}

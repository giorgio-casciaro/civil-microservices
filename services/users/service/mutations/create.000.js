module.exports = function (state, data) {
  // state.status = 0
  state.publicName = data.publicName || data.email.split('@')[0]
  state.personalInfo = data.personalInfo || {}
  state.passwordAssigned = false
  state.meta = {}
  state.logins = 0
  state.permissions = []
  state.pics = {}
  state.logouts = 0
  state.id = data.id
  state.email = data.email
  state.emailConfirmationCode = data.emailConfirmationCode
  state.emailConfirmed = false
  return state
}

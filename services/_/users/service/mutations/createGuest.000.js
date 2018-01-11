module.exports = function (state, data) {
  state.id = data.id
  state.password = data.password
  state.publicName = data.publicName || data.email.split('@')[0]
  state.email = data.email
  state.info = data.info
  state.guest = 1
  state.tags = []
  return state
}

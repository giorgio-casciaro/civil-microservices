module.exports = function (state, data) {
  state.password = data.password
  state.passwordAssigned = true
  return state
}

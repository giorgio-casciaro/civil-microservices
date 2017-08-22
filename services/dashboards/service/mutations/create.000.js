module.exports = function (state, data) {
  state = Object.assign(state, data)
  state.status = 0
  return state
}

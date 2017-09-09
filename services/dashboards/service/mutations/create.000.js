module.exports = function (state, data) {
  state = Object.assign(state, data)
  if (!state.tags)state.tags = []
  state.status = 0
  return state
}

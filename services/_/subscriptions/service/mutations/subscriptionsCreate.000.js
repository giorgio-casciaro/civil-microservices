module.exports = function (state, data) {
  state = Object.assign(state, data)
  if (!state.tags)state.tags = []
  return state
}

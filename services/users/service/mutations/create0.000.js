module.exports = function (state, data) {
  state = Object.assign({meta: state.meta}, data)
  if (!state.tags)state.tags = []
  return state
}

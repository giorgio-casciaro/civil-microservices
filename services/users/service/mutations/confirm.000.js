module.exports = function (state, data) {
  if (!state.meta)state.meta = {}
  state.meta.confirmed = true
  return state
}

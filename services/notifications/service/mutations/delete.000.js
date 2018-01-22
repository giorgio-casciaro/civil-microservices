module.exports = function (state, data) {
  if (!state.meta)state.meta = {}
  state.meta.deleted = true
  return state
}

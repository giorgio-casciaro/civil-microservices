module.exports = function (state, roleId) {
  if (state.roles && state.roles[roleId]) delete state.roles[roleId]
  return state
}

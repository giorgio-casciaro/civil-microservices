 module.exports = function (state, data) {
   if (!state.roles)state.roles = {}
   state.roles[data.id] = data
   return state
 }

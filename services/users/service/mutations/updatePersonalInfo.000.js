 module.exports = function (state, data) {
   state.firstName = data.firstName
   state.lastName = data.lastName
   state.birth = data.birth
   state.publicName = data.publicName
   return state
 }

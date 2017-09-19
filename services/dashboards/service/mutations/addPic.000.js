 module.exports = function (state, data) {
   if (!state.pics || !state.pics.push)state.pics = []
   state.pics.push(data.picId)
  //  state.hasPics = true
   return state
 }

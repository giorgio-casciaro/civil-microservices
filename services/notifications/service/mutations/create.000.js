module.exports = function (state, data) {
  state.id = data.id
  state.objectId = data.objectId
  state.userId = data.userId
  state.channels = []
  state.sendsInfo = {}
  state.toSend = true
  return state
}

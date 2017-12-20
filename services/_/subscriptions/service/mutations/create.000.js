module.exports = function (state, data) {
  state = Object.assign(state, data)
  if (!state.tags)state.tags = []
  if (!state.options) {
    state.options = {
      guestRead: 'allow',
      guestSubscribe: 'allow',
      guestWrite: 'confirm',
      subscriberWrite: 'allow'
    }
  }
  return state
}

module.exports = function (state, data) {
  state = Object.assign(state, data)
  if (!state.tags)state.tags = []
  if (!state.options)state.options = {}
  Object.assign(state.options, {
    guestRead: 'allow',
    guestSubscribe: 'confirm',
    guestWrite: 'confirm',
    subscriberWrite: 'confirm'
  })
  state.status = 0
  return state
}

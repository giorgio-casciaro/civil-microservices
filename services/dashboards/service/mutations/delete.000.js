module.exports = function (state, data) {
  return Object.assign({}, state, {_deleted:true})
}

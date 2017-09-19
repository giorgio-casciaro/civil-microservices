var MODULE_NAME = 'Dashboard Posts - '

const path = require('path')
const uuid = require('uuid/v4')
const fs = require('fs')

const Aerospike = require('aerospike')
const Key = Aerospike.Key
const GeoJSON = Aerospike.GeoJSON
const kvDb = require('sint-bit-utils/utils/kvDb')
const pic = require('sint-bit-utils/utils/pic')

var CONFIG = require('./config')
var aerospikeConfig = CONFIG.aerospikePosts
var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })

const auth = require('sint-bit-utils/utils/auth')

var kvDbClient
var CONSOLE
var subscriptionCan

async function mutate (args) {
  try {
    var mutation = mutationsPack.mutate(args)
    var key = new Key(aerospikeConfig.namespace, aerospikeConfig.mutationsSet, mutation.id)
    await kvDb.put(kvDbClient, key, mutation)
    return mutation
  } catch (error) {
    throw new Error(MODULE_NAME + 'problems during mutate a ' + error)
  }
}
async function getView (id, view = null, stateOnly = true) {
  try {
    var key = new Key(aerospikeConfig.namespace, aerospikeConfig.set, id)
    if (!view) view = await kvDb.get(kvDbClient, key)
    if (!view) return null
    if (view.state)view.state = JSON.parse(view.state)
    if (stateOnly) {
      view.state.created = view.created
      view.state.updated = view.updated
      return view.state
    }
    return view
  } catch (error) { throw new Error(MODULE_NAME + 'problems during getView ' + error) }
}
async function diffUpdatedView (oldState, newState) {
  var oldTags = oldState.tags ? oldState.tags : []
  var newTags = newState.tags ? newState.tags : []
  var dashId = newState.dashId
  var op = Aerospike.operator
  var ops = []

  // REMOVED TAGS
  var removedTags = oldTags.filter(x => newTags.indexOf(x) < 0)
  ops = ops.concat(removedTags.map((tag) => op.decr('#' + tag, 1)))
  // ADDED TAGS
  var addedTags = newTags.filter(x => oldTags.indexOf(x) < 0)
  ops = ops.concat(addedTags.map((tag) => op.incr('#' + tag, 1)))
  CONSOLE.hl('Posts diffUpdatedView', oldTags, newTags, removedTags, addedTags)
  CONSOLE.hl('Posts diffUpdatedView ops', ops)

  await kvDb.operate(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_meta'), ops)
  var dashMeta = await getDashPostsMeta(dashId)
  CONSOLE.hl('Posts diffUpdatedView dashMeta', dashMeta)
}
async function getDashPostsMeta (dashId) {
  var dashPostMeta = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_meta'))
  return dashPostMeta
}
async function updateView (id, mutations, isNew) {
  try {
    var key = new Key(aerospikeConfig.namespace, aerospikeConfig.set, id)
    var rawView = await getView(id, null, false) || {state: {}}
    var state = mutationsPack.applyMutations(rawView.state, mutations)
    var view = {
      updated: Date.now(),
      created: rawView.created || Date.now(),
      id: state.id,
      dashId: state.dashId,
      state: JSON.stringify(state),
      tags: state.tags || []
    }
    if (state.location && state.location[0])view.location = new GeoJSON({type: 'Point', coordinates: [state.location[0].lng, state.location[0].lat]})
    await kvDb.put(kvDbClient, key, view)
    await diffUpdatedView(rawView.state, state)
    return view
  } catch (error) { throw new Error(MODULE_NAME + 'problems during updateView ' + error) }
}
async function addTag (id, tag, meta) {
  var mutation = await mutate({data: tag, objId: id, mutation: 'addTag', meta})
  await updateView(id, [mutation])
}
async function removeTag (id, tag, meta) {
  var mutation = await mutate({data: tag, objId: id, mutation: 'removeTag', meta})
  await updateView(id, [mutation])
}
async function incrementDashPostNumber (dashId) {
  var op = Aerospike.operator
  var ops = [
    op.incr('count', 1),
    op.read('count')
  ]
  var dashPostsNumber = await kvDb.operate(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_meta'), ops)
  return dashPostsNumber
}
// async function getDashPostNumber (dashId) {
//   var dashPostsNumber = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_meta'))
//   return dashPostsNumber.count
// }
async function create (reqData, meta = {directCall: true}, getStream = null) {
  var dashId = reqData.dashId
  var dashCounter = await incrementDashPostNumber(dashId)
  var id = dashId + '_' + dashCounter.count
  CONSOLE.hl('dashPostsNumber', dashId, dashCounter, id)
  reqData.id = id
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  // se lo user non è un admin (can "write") può inserire solo post a suo nome
  if (userId !== reqData.userId) await subscriptionCan(reqData.dashId, userId, 'writeOtherUsersPosts')
  else await subscriptionCan(reqData.dashId, userId, 'writePosts')
  if (reqData.tags)reqData.tags = reqData.tags.map((item) => item.replace('#', ''))
  CONSOLE.hl('dashPostCreate', reqData)
  var mutation = await mutate({data: reqData, objId: id, mutation: 'create', meta})
  await updateView(id, [mutation], true)
  return {success: MODULE_NAME + `created`, id}
}
function checkToTags (to, tags, userId) {
  var founded = false
  for (var tag of tags) {
    if (to.indexOf('#' + tag.replace('#', '')) >= 0)founded = true
    if (to.indexOf('@' + userId) >= 0)founded = true
  }
  CONSOLE.hl('checkToTags', to, tags, userId, founded)
  return founded
}

async function read (reqData, meta = {directCall: true}, getStream = null) {
  // CONSOLE.hl('READPOST', reqData)
  var id = reqData.id
  // var currentState = {id: 'test', test: 'test'}
  // var currentState = await getView(id)
  // if (!currentState || currentState.tags.indexOf('removed') >= 0) {
  //   throw new Error(MODULE_NAME + ' not active')
  // }
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  // var subscription = await subscriptionCan(currentState.dashId, userId, 'readPosts')
  // if (!currentState.public) {
  //   if (!currentState.to) {
  //     throw new Error(MODULE_NAME + ' no receivers is empty')
  //   }
  //   if (!checkToTags(currentState.to, subscription.tags, userId)) { // currentState.to.indexOf('@' + userId) < 0 ||
  //     throw new Error(MODULE_NAME + ' not readable by userId ' + userId)
  //   }
  // }
  // currentState.subscriptionId = subscription.id
  var currentState = await readPost(id, userId)
  return currentState
}
async function readPost (id, userId, subscription) {
  var currentState = await getView(id)
  if (!subscription)subscription = await subscriptionCan(currentState.dashId, userId, 'readPosts')
  if (!currentState || currentState.tags.indexOf('removed') >= 0) return null
  if (!currentState.public) {
    if (!currentState.to) {
      throw new Error(MODULE_NAME + ' no receivers is empty')
    }
    if (!checkToTags(currentState.to, subscription.tags, userId)) { // currentState.to.indexOf('@' + userId) < 0 ||
      throw new Error(MODULE_NAME + ' not readable by userId ' + userId)
    }
  }
  currentState.subscriptionId = subscription.id
  return currentState
}

async function update (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var currentState = await getView(id)
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  if (userId !== currentState.userId) await subscriptionCan(currentState.dashId, userId, 'writeOtherUsersPosts')
  else await subscriptionCan(currentState.dashId, userId, 'writePosts')
  if (reqData.tags)reqData.tags = reqData.tags.map((item) => item.replace('#', ''))
  var mutation = await mutate({data: reqData, objId: id, mutation: 'update', meta})
  await updateView(id, [mutation])
  return {success: MODULE_NAME + `updated`}
}
async function remove (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var currentState = await getView(id)
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  if (userId !== currentState.userId) await subscriptionCan(currentState.dashId, userId, 'writeOtherUsersPosts')
  else await subscriptionCan(currentState.dashId, userId, 'writePosts')
  await addTag(id, 'removed', meta)
  return {success: MODULE_NAME + `removed`}
}
async function updatePic (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var dashId = reqData.dashId
  try {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    await subscriptionCan(dashId, userId, 'writePosts')
  } catch (error) {
    await new Promise((resolve, reject) => fs.unlink(reqData.pic.path, (err, data) => err ? resolve(err) : resolve(data)))
    throw error
  }
  var returnData = await pic.updatePic(aerospikeConfig, kvDbClient, id, reqData.pic.path, CONFIG.uploadPath, [['mini', 100, 100]])
  return returnData
}
async function getPic (reqData, meta = {directCall: true}, getStream = null) {
  var returnData = await pic.getPic(aerospikeConfig, kvDbClient, reqData.id, reqData.size || 'mini')
  return returnData
}
async function addPic (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var currentState = await getView(id)
  var postPics = currentState.pics || []
  var dashId = currentState.dashId
  var picId = uuid()
  await updatePic({id: picId, pic: reqData.pic, dashId: dashId}, meta, getStream)
  postPics.push(picId)
  await update({id: id, pics: postPics}, meta, getStream)
  return {success: MODULE_NAME + `pic updated`}
}
async function removePic (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var picId = reqData.picId
  var currentState = await getView(id)
  if (!currentState.pics || currentState.pics.indexOf(picId) < 0) {
    throw new Error(MODULE_NAME + ' pic no exists ' + picId)
  }
  var postPics = currentState.pics
  postPics.splice(postPics.indexOf(picId), 1)
  await update({id: id, pics: postPics}, meta, getStream)
  return {success: MODULE_NAME + `pic removed`}
}
async function queryByTimestamp (query = {}, meta = {directCall: true}, getStream = null) {
  // await auth.userCan('dashboard.read.query', meta, CONFIG.jwt)
  query = Object.assign({from: 0, to: 100000000000000}, query)
  var rawResults = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => { dbQuery.where(Aerospike.filter.range('updated', query.from, query.to)) })
  var results = await Promise.all(rawResults.map((result) => getView(result.id, result)))
  return results
}

async function queryLastPosts (reqData = {}, meta = {directCall: true}, getStream = null) {
  var dashId = reqData.dashId
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var subscription = await subscriptionCan(dashId, userId, 'readPosts')

  var dashPostsMeta = await getDashPostsMeta(dashId)
  var dashPostsNumber = dashPostsMeta ? dashPostsMeta.count : 0
  reqData = Object.assign({from: 0, to: 20}, reqData)
  var rawIds = []
  for (var i = reqData.from; i < reqData.to; i++) {
    rawIds.push(dashId + '_' + (dashPostsNumber - i))
  }
  CONSOLE.hl('queryLastPosts', dashId, dashPostsNumber, userId, rawIds)
  // return {}
  // await subscriptionCan(reqData.dashId, userId, 'readPosts')
  var results = await Promise.all(rawIds.map((id) => readPost(id, userId, subscription)))
  return results.filter((post) => post !== null)
}
module.exports = {
  init: async function (setCONSOLE, setKvDbClient, setSubscriptionCan) {
    CONSOLE = setCONSOLE
    kvDbClient = setKvDbClient
    subscriptionCan = setSubscriptionCan
    // DB INDEXES
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'created', index: aerospikeConfig.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'updated', index: aerospikeConfig.set + '_updated', datatype: Aerospike.indexDataType.NUMERIC })
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'location', index: aerospikeConfig.set + '_location', datatype: Aerospike.indexDataType.GEO2DSPHERE })
    CONSOLE.log(MODULE_NAME + ` finish init`)
  },
  getDashPostsMeta,
  addPic,
  removePic,
  getPic,
  create,
  read,
  update,
  remove,
  updateView,
  getView,
  addTag,
  removeTag,
  queryByTimestamp,
  queryLastPosts
}

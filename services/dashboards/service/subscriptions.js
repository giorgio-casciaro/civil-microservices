var MODULE_NAME = 'Dashboard Subscriptions - '

const path = require('path')
const uuid = require('uuid/v4')
const fs = require('fs')

const Aerospike = require('aerospike')
const Key = Aerospike.Key
const GeoJSON = Aerospike.GeoJSON
const kvDb = require('sint-bit-utils/utils/kvDb')
const pic = require('sint-bit-utils/utils/pic')
const metaUtils = require('sint-bit-utils/utils/meta')

var CONFIG = require('./config')
var aerospikeConfig = CONFIG.aerospike.subscriptions
var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })

const auth = require('sint-bit-utils/utils/auth')

var dashboards = require('./methods')

const getByDashIdAndUserId = async function (dashId, userId) {
  try {
    CONSOLE.hl('getByDashIdAndUserId', `${dashId}${userId}`)
    var result = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
      dbQuery.where(Aerospike.filter.equal('dashIdUserId', `${dashId}${userId}`))
    })
    if (!result[0]) return null
    return await getView(result[0].id, result[0])
  } catch (error) { throw new Error('problems during getByDashIdAndUserId ' + error) }
}
const can = async function (dashId, userId, can, role, subscriptionId) {
  try {
    var subscription
    if (subscriptionId)subscription = await getView(subscriptionId)
    else subscription = await getByDashIdAndUserId(dashId, userId)
    if (!subscription || subscription._deleted || !subscription._confirmed) subscription = {id: '0_0', roleId: 'guest', dashId, userId, _confirmed: 1, permissions: []}
    // if (subscription._deleted || !subscription._confirmed) {
    //   throw new Error('subscription deleted or not confirmed')
    // }
    if (!role)role = await dashboards.getDashRole(subscription.roleId, dashId)
    if (!role) throw new Error(`role ${subscription.roleId} not exists`)
    CONSOLE.hl('can subscription', subscription, dashId, userId, can, role)
    var rolePermissions = role.permissions || []
    CONSOLE.hl('can rolePermissions', role, rolePermissions)

    if (!rolePermissions || rolePermissions.indexOf(can) === -1) throw new Error('Dashboard Role ' + role.id + ' have no permissions to ' + can)
    return subscription
  } catch (error) { throw new Error('problems during can ' + error) }
}
const mutate = async function (args) {
  try {
    var mutation = mutationsPack.mutate(args)
    CONSOLE.debug('mutate', mutation)
    var key = new Key(aerospikeConfig.namespace, aerospikeConfig.mutationsSet, mutation.id)
    await kvDb.put(kvDbClient, key, mutation)
    return mutation
  } catch (error) {
    throw new Error('problems during mutate a ' + error)
  }
}
async function diffUpdatedView (oldState, newState) {
  var oldTags = oldState.tags ? oldState.tags : []
  var newTags = newState.tags ? newState.tags : []
  var dashId = newState.dashId
  var op = Aerospike.operator
  var ops = []

  // REMOVED TAGS
  var removedTags = oldTags.filter(x => newTags.indexOf(x) < 0)
  ops = ops.concat(removedTags.map((tag) => op.incr('#' + tag, -1)))
  // ADDED TAGS
  var addedTags = newTags.filter(x => oldTags.indexOf(x) < 0)
  ops = ops.concat(addedTags.map((tag) => op.incr('#' + tag, 1)))
  // NEW SUBSCRIPTION
  // if (!oldState)ops.push(op.incr('count', 1))
  // DELETED SUBSCRIPTION
  // if (addedTags.indexOf('removed') >= 0)ops.push(op.incr('count', -1))
  // DELETED SUBSCRIPTION
  CONSOLE.hl('diffUpdatedView', oldTags, newTags, removedTags, addedTags, ops)
  await kvDb.operate(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_meta'), ops)
}
async function getDashMeta (dashId) {
  var meta = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_meta'))
  return meta
}
async function incrementDashMetaCount (dashId) {
  var op = Aerospike.operator
  var ops = [
    op.incr('count', 1),
    op.read('count')
  ]
  var count = await kvDb.operate(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_meta'), ops)
  CONSOLE.hl('incrementDashMetaCount', count)
  return count
}
const updateView = async function (id, mutations, isNew) {
  try {
    var key = new Key(aerospikeConfig.namespace, aerospikeConfig.set, id)
    var rawView = await getView(id, null, false) || {state: {}}
    var state = mutationsPack.applyMutations(rawView.state, mutations)
    // CONSOLE.hl('updateView state', state)
    var view = {
      updated: Date.now(),
      created: rawView.created || Date.now(),
      id: '' + state.id,
      dashId: '' + state.dashId,
      dashIdUserId: `${state.dashId}${state.userId}`,
      userId: '' + state.userId,
      tags: state.tags || [],
      roleId: state.roleId,
      state: JSON.stringify(state)
    }
    CONSOLE.hl('updateView view', view)
    await kvDb.put(kvDbClient, key, view)
    await diffUpdatedView(rawView.state, state)
    return view
  } catch (error) { throw new Error('problems during updateView ' + error) }
}
const getView = async function (id, view = null, stateOnly = true) {
  try {
    var key = new Key(aerospikeConfig.namespace, aerospikeConfig.set, id)
    if (!view) view = await kvDb.get(kvDbClient, key)
    if (!view) return null
    if (view.state)view.state = JSON.parse(view.state)
    CONSOLE.hl('getView', {id, view, viewState: view.state, stateOnly})
    if (stateOnly) return view.state
    return view
  } catch (error) { throw new Error('problems during getView ' + error) }
}
const addTag = async function (id, tag, meta) {
  var mutation = await mutate({data: tag, objId: id, mutation: 'addTag', meta})
  await updateView(id, [mutation])
}
const removeTag = async function (id, tag, meta) {
  var mutation = await mutate({data: tag, objId: id, mutation: 'removeTag', meta})
  await updateView(id, [mutation])
}
const createRaw = async function (reqData, meta = {directCall: true}, getStream = null) {
  var subscriptionsMeta = await incrementDashMetaCount(reqData.dashId)
  if (!subscriptionsMeta)subscriptionsMeta = {count: 0}
  if (!subscriptionsMeta.count)subscriptionsMeta.count = 0
  var id = reqData.dashId + '_' + (subscriptionsMeta.count)
  CONSOLE.hl('createRaw', id, reqData, subscriptionsMeta)
  reqData.id = id
  if (reqData.tags)reqData.tags = reqData.tags.map((item) => reqData.dashId + '_' + item.replace('#', ''))

  var mutation = await mutate({data: reqData, objId: id, mutation: 'subscriptionsCreate', meta})
  await updateView(id, [mutation], true)
  return {success: `Subscription created`, id}
}
const create = async function (reqData, meta = {directCall: true}, getStream = null) {
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  if (!reqData.userId)reqData.userId = userId
  if (reqData.userId !== userId) {
    // ONLY ADMIN OR SUBSCRIPTION OWNER
    await can(reqData.dashId, userId, 'writeSubscriptions')
    reqData._confirmed = 1
  } else {
    try {
      await can(reqData.dashId, userId, 'subscribe')
      reqData._confirmed = 1
    } catch (error) {
      await can(reqData.dashId, userId, 'confirmSubscribe')
      reqData._confirmed = 0
    }
  }
  if (!reqData.roleId)reqData.roleId = 'subscriber'
  var role = await dashboards.getDashRole(reqData.roleId, reqData.dashId)
  if (!role) {
    throw new Error('Role not exists or is not active')
  }
  CONSOLE.hl('role', role)
  // NOT PUBLIC ROLES CAN BE ASSIGNED ONLY WITH WRITE PERMISSIONS
  if (parseInt(role.public) !== 1) await can(reqData.dashId, userId, 'writeSubscriptions')

  // var dashData = dashboards.readDashboard(reqData.dashId)
  // CONSOLE.hl('dashData', dashData)
  var returnResults = await createRaw(reqData, meta)
  return returnResults
}
async function addToDashSubscriptionsToConfirmMeta (dashId, id) {
  var key = new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_confirm')
  var meta = await kvDb.get(kvDbClient, key)
  if (!meta || !meta.items)meta = {items: []}
  CONSOLE.hl('addToDashSubscriptionsToConfirmMeta', {meta})
  meta.items.push(id)
  await kvDb.put(kvDbClient, key, meta)
}
async function removeFromDashSubscriptionsToConfirmMeta (dashId, id) {
  var key = new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_confirm')
  var meta = await kvDb.get(kvDbClient, key) || {items: []}
  CONSOLE.hl('removeFromDashSubscriptionsToConfirmMeta', {meta})
  meta.items.splice(meta.items.indexOf(id), 1)
  await kvDb.put(kvDbClient, key, meta)
}
async function getDashSubscriptionsToConfirmMeta (dashId) {
  var key = new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, dashId + '_confirm')
  var meta = await kvDb.get(kvDbClient, key) || {items: []}
  CONSOLE.hl('getDashSubscriptionsToConfirmMeta', {meta})
  return meta.items
}
async function confirm (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var currentState = await getView(id)
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  await can(currentState.dashId, userId, 'confirmSubscriptions')
  var mutation = await mutate({data: reqData, objId: id, mutation: 'confirmPost', meta})
  var view = await updateView(id, [mutation])
  await removeFromDashSubscriptionsToConfirmMeta(view.dashId, view.id)
  return {success: MODULE_NAME + ` confirmed`}
}
async function readSubscription (id, userId, dashId, options = { meta: null, rawView: null, guestIfNull: false, user: false, dash: false }) {
  var guestSubscription = {id: '0_0', roleId: 'guest', dashId, userId, _confirmed: 1, permissions: []}
  var currentState = await getView(id, options.rawView)
  if (!currentState) {
    if (options.guestIfNull)currentState = guestSubscription
    else return null
  }
  if (currentState._deleted || !currentState._confirmed) {
    await can(currentState.dashId, userId, 'readSubscription')
  }
  if (options.dash)currentState.dashboard = await dashboards.getDashboardInfo(currentState.dashId)
  if (options.user)currentState.user = await netClient.rpc('readUser', {id: currentState.userId}, options.meta)
  return currentState
}

async function read (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var currentState = await readSubscription(id, userId)
  if (currentState.userId !== userId) {
    await can(currentState.dashId, userId, 'readSubscription')
  }
  return currentState
}
async function readMultiple (reqData, meta = {directCall: true}, getStream = null) {
  var ids = reqData.ids
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var results = []
  var currentState
  var id
  for (id of ids) {
    currentState = readSubscription(id, userId)
    if (currentState.userId !== userId) {
      await can(currentState.dashId, userId, 'readSubscriptions')
    }
    if (currentState)results.push(currentState)
  }
  return results
}
async function update (reqData, meta = {directCall: true}, getStream = null) {
  CONSOLE.hl('update reqData', reqData)
  var id = reqData.id
  var currentState = await getView(id)
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  // if (currentState.userId !== userId) {
    // ONLY ADMIN OR SUBSCRIPTION OWNER
  await can(currentState.dashId, userId, 'writeSubscriptions')
  // }
  if (reqData.roleId) {
    // NOT PUBLIC ROLES CAN BE ASSIGNED ONLY WITH WRITE PERMISSIONS
    var role = await dashboards.getDashRole(reqData.roleId, currentState.dashId)
    if (!role) {
      throw new Error('Role not exists or is not active')
    }
    if (parseInt(role.public) !== 1) await can(currentState.dashId, userId, 'writeSubscriptions', role)
  }
  if (reqData.tags)reqData.tags = reqData.tags.map((item) => item.replace('#', ''))
  var mutation = await mutate({data: reqData, objId: id, mutation: 'update', meta})
  await updateView(id, [mutation])
  return {success: `Subscription updated`}
}
async function remove (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var currentState = await getView(id)
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  if (currentState.userId !== userId) {
    // ONLY ADMIN OR SUBSCRIPTION OWNER
    await can(currentState.dashId, userId, 'writeSubscription')
  }
  var mutation = await mutate({data: {}, objId: id, mutation: 'delete', meta})
  await updateView(id, [mutation])
  return {success: `Subscription removed`}
}
async function getExtendedByUserId (reqData, meta = {directCall: true}, getStream = null) {
  try {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var rawResults = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
      dbQuery.where(Aerospike.filter.equal('userId', userId))
    })
    CONSOLE.hl('getExtendedByUserId rawResults', rawResults)

    // var results = rawResults.map(extendSubscription)
    // getView
    // var results = await Promise.all(rawResults.map(extendSubscription))
    var results = await Promise.all(rawResults.map((rawResult) => getView(rawResult.id, rawResult)))
    results = await Promise.all(results.map(extendSubscription))
    CONSOLE.hl('getExtendedByUserId results', results)
    return results
  } catch (error) { throw new Error('problems during getExtendedByUserId ' + error) }
}
async function extendSubscription (subscription) {
  // if (typeof subscription === 'string')subscription = JSON.parse(subscription)
  subscription.dashInfo = await dashboards.getDashboardInfo(subscription.dashId)
  // subscription.dashInfo.subscriptionsMeta = metaUtils.optimize(await getDashMeta(subscription.dashId))
  // subscription.dashInfo.postsMeta = metaUtils.optimize(await posts.getDashPostsMeta(subscription.dashId))
  // subscription.dashInfo.roles = await dashboards.getDashRoles(subscription.dashId)
  return subscription
}
async function getByTagsAndRoles (dashId, tags, roles, select = ['notifications', 'userId']) {
  var result = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
    dbQuery.select(select)
    dbQuery.where(Aerospike.filter.equal('dashId', dashId))
    dbQuery.setUdf('notifications', 'filterByTagsAndRoles', tags, roles)
  })
  return result
}
async function queryLast (reqData = {}, meta = {directCall: true}, getStream = null) {
  var dashId = reqData.dashId
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var subscription = await can(dashId, userId, 'readSubscriptions')

  var dashSubscriptionsMeta = await getDashMeta(dashId)
  var dashSubscriptionsNumber = (dashSubscriptionsMeta.count || 0)
  reqData = Object.assign({from: 0, to: 20}, reqData)
  var rawIds = []
  for (var i = reqData.from; i < reqData.to; i++) {
    if (dashSubscriptionsNumber - i >= 0)rawIds.push(dashId + '_' + (dashSubscriptionsNumber - i))
  }
  CONSOLE.hl('queryLast', dashId, dashSubscriptionsNumber, userId, rawIds)

  var results = await Promise.all(rawIds.map((id) => readSubscription(id, userId, dashId, {meta, user: true})))
  CONSOLE.hl('queryLast results', results)
  results = results.filter((subscription) => subscription !== null)
  return results
}
async function query (reqData = {}, meta = {directCall: true}, getStream = null) {
  var results = await getByTagsAndRoles(reqData.dashId, reqData.tags, reqData.roles)
  CONSOLE.hl('query results', results)
  // var dashId = reqData.dashId
  // var query = kvDbClient.query(aerospikeConfig.namespace, aerospikeConfig.set)
  // query.where(Aerospike.filter.equal('dashId', dashId))
  // query.apply('example', 'filter_stream', function (err, result) {
  //   if (err) throw err
  //   CONSOLE.hl('query results', result)
  // })
}
// async function queryFiltered (options, filterName, filterValue) {
//   var results = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
//     if (filterName)dbQuery.where(Aerospike.filter.equal(filterName, filterValue))
//     dbQuery.setUdf('example', 'filter_stream')
//   })
//   CONSOLE.hl('query results', results)
//   // var dashId = reqData.dashId
//   // var query = kvDbClient.query(aerospikeConfig.namespace, aerospikeConfig.set)
//   // query.where(Aerospike.filter.equal('dashId', dashId))
//   // query.apply('example', 'filter_stream', function (err, result) {
//   //   if (err) throw err
//   //   CONSOLE.hl('query results', result)
//   // })
// }

var netClient, CONSOLE, kvDbClient, dashboards

module.exports = {
  init: async function (setNetClient, setCONSOLE, setKvDbClient, setDashboards) {
    CONSOLE = setCONSOLE
    kvDbClient = setKvDbClient
    netClient = setNetClient
    // dashboards.readDashboard = setReadDashboard
    // dashboards.getDashRole = setGetDashRole
    dashboards = setDashboards
    // posts = setPosts
    // dashboards.getDashRoles = setGetDashRoles
    // DB INDEXES
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'userId', index: aerospikeConfig.set + '_userId', datatype: Aerospike.indexDataType.STRING })
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'dashId', index: aerospikeConfig.set + '_dashId', datatype: Aerospike.indexDataType.STRING })
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'dashIdUserId', index: aerospikeConfig.set + '_dashIdUserId', datatype: Aerospike.indexDataType.STRING })
    await kvDb.udfRegister(kvDbClient, { udf: path.join(__dirname, '/lua/notifications.lua') })
    CONSOLE.log(MODULE_NAME + ` finish init`)
    // setInterval(() => {
    //   CONSOLE.hl('EMIT TEST EVENT')
    //   netClient.emit('testRemoteEvent', {'testEvent': Date.now()})
    // }, 1000)
  },
  getByDashIdAndUserId,
  can,
  createRaw,
  getDashMeta,
  getDashSubscriptionsToConfirmMeta,
  create,
  read,
  readSubscription,
  readMultiple,
  update,
  remove,
  getExtendedByUserId,
  queryLast,
  query
}

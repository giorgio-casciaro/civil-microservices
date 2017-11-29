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

// var dashboards = require('./methods')

const getByDashIdAndUserId = async function (dashId, userId) {
  try {
    CONSOLE.hl('getByDashIdAndUserId', `${dashId}${userId}`)
    var result = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
      dbQuery.where(Aerospike.filter.equal('dashIdUserId', `${dashId}${userId}`))
    })
    if (!result[0]) return {id: '0_0', roleId: 'guest', dashId, userId, _confirmed: 1, permissions: []}
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
    CONSOLE.hl('can subscription', subscription, dashId, userId, can, role)
    if (!role)role = await dashboards.getDashRole(subscription.roleId, dashId)
    if (!role) throw new Error(`role ${subscription.roleId} not exists`)
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
    var rawView = await getView(id, null, false) || {}
    var state = mutationsPack.applyMutations(rawView, mutations)
    CONSOLE.hl('updateView state', state)
    var view = {
      updated: Date.now(),
      created: rawView.created || Date.now(),
      id: '' + state.id,
      dashId: '' + state.dashId,
      notifications: state.notifications || ['email', 'sms', 'fb'],
      dashIdUserId: `${state.dashId}${state.userId}`,
      userId: '' + state.userId,
      tags: state.tags || [],
      roleId: state.roleId
    }
    var jsonState = {}
    var viewKeys = Object.keys(view)
    Object.keys(state).forEach(function (key) {
      if (viewKeys.indexOf() < 0)jsonState[key] = state[key]
    })
    view.state = JSON.stringify(jsonState)
    CONSOLE.hl('updateView view', view)
    await kvDb.put(kvDbClient, key, view)
    await diffUpdatedView(rawView, state)
    return view
  } catch (error) { throw new Error('problems during updateView ' + error) }
}

const getView = async function (id, view = null) {
  try {
    var key = new Key(aerospikeConfig.namespace, aerospikeConfig.set, id)
    if (!view) view = await kvDb.get(kvDbClient, key)
    if (!view) return null
    if (view.state) {
      var state = JSON.parse(view.state)
      var expandedView = Object.assign({}, view, state)
      delete expandedView.state
      return expandedView
    }
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
  // if (reqData.tags)reqData.tags = reqData.tags.map((item) => reqData.dashId + '_' + item.replace('#', ''))

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
  CONSOLE.hl('create data', reqData)
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
  var mutation = await mutate({data: reqData, objId: id, mutation: 'postsConfirm', meta})
  var view = await updateView(id, [mutation])
  await removeFromDashSubscriptionsToConfirmMeta(view.dashId, view.id)
  return {success: MODULE_NAME + ` confirmed`}
}
async function subscriptionsRead (id, userId, dashId, options = { meta: null, rawView: null, guestIfNull: false, user: false, dash: false }) {
  var guestSubscription = {id: '0_0', roleId: 'guest', dashId, userId, _confirmed: 1, permissions: []}
  var currentState = await getView(id, options.rawView)
  if (!currentState) {
    if (options.guestIfNull)currentState = guestSubscription
    else return null
  }
  if (currentState._deleted || !currentState._confirmed) {
    await can(currentState.dashId, userId, 'subscriptionsRead')
  }
  if (options.dash)currentState.dashboard = await dashboards.getDashboardInfo(currentState.dashId)
  if (options.user)currentState.user = await netClient.rpc('readUser', {id: currentState.userId}, options.meta)
  return currentState
}

async function read (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var currentState = await subscriptionsRead(id, userId)
  if (currentState.userId !== userId) {
    await can(currentState.dashId, userId, 'subscriptionsRead')
  }
  return currentState
}

async function readByDashIdAndUserId (reqData, meta = {directCall: true}, getStream = null) {
  var dashId = reqData.dashId
  var userId = reqData.userId
  var subscription = await getByDashIdAndUserId(dashId, userId)
  CONSOLE.hl('readByDashIdAndUserId subscription', subscription)
  subscription.role = await dashboards.getDashRole(subscription.roleId, dashId)
  return subscription
}
async function readMultiple (reqData, meta = {directCall: true}, getStream = null) {
  var ids = reqData.ids
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var results = []
  var currentState
  var id
  for (id of ids) {
    currentState = subscriptionsRead(id, userId)
    if (currentState.userId !== userId) {
      await can(currentState.dashId, userId, 'subscriptionsReads')
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
async function getByTagsAndRoles (dashId, tags = [], roles = [], select = ['notifications', 'userId', 'tags', 'roleId']) {
  try {
    var result = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
      dbQuery.select(select)
      dbQuery.where(Aerospike.filter.equal('dashId', dashId))
      dbQuery.setUdf('query', 'filterByTagsAndRoles', [select, tags, roles])
    })
    return result
  } catch (error) { throw new Error('problems during getByTagsAndRoles ' + error) }
}
async function getByDashId (dashId, select = ['notifications', 'userId', 'tags', 'roleId']) {
  try {
    var result = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
      dbQuery.select(select)
      dbQuery.where(Aerospike.filter.equal('dashId', dashId))
    })
    return result
  } catch (error) { throw new Error('problems during getByDashId ' + error) }
}
async function queryLast (reqData = {}, meta = {directCall: true}, getStream = null) {
  var dashId = reqData.dashId
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var subscription = await can(dashId, userId, 'subscriptionsReads')

  var dashSubscriptionsMeta = await getDashMeta(dashId)
  var dashSubscriptionsNumber = (dashSubscriptionsMeta.count || 0)
  reqData = Object.assign({from: 0, to: 20}, reqData)
  var rawIds = []
  for (var i = reqData.from; i < reqData.to; i++) {
    if (dashSubscriptionsNumber - i >= 0)rawIds.push(dashId + '_' + (dashSubscriptionsNumber - i))
  }
  CONSOLE.hl('queryLast', dashId, dashSubscriptionsNumber, userId, rawIds)

  var results = await Promise.all(rawIds.map((id) => subscriptionsRead(id, userId, dashId, {meta, user: true})))
  CONSOLE.hl('queryLast results', results)
  results = results.filter((subscription) => subscription !== null)
  return results
}
async function queryByTagsAndRoles (reqData = {}, meta = {directCall: true}, getStream = null) {
  var results = await getByTagsAndRoles(reqData.dashId, reqData.tags, reqData.roles, reqData.select)
  CONSOLE.hl('query results', results)
  return results
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
    dashboards = setDashboards

    var secondaryIndexUserId = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexLocation'))
    if (!secondaryIndexUserId) {
      await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'userId', index: aerospikeConfig.set + '_userId', datatype: Aerospike.indexDataType.STRING })
      await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexUserId'), {created: Date.now()})
    }
    var secondaryIndexDashId = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexDashId'))
    if (!secondaryIndexDashId) {
      await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'dashId', index: aerospikeConfig.set + '_dashId', datatype: Aerospike.indexDataType.STRING })
      await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexDashId'), {created: Date.now()})
    }
    var secondaryIndexDashIdUserId = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexDashIdUserId'))
    if (!secondaryIndexDashIdUserId) {
      await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'dashIdUserId', index: aerospikeConfig.set + '_dashIdUserId', datatype: Aerospike.indexDataType.STRING })
      await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexDashIdUserId'), {created: Date.now()})
    }

    CONSOLE.hl('INIT Secondary Index', {secondaryIndexUserId, secondaryIndexDashId, secondaryIndexDashIdUserId})
  },
  getByDashIdAndUserId,
  can,
  createRaw,
  getDashMeta,
  getDashSubscriptionsToConfirmMeta,
  create,
  read,
  readByDashIdAndUserId,
  subscriptionsRead,
  readMultiple,
  update,
  remove,
  getExtendedByUserId,
  queryLast,
  queryByTagsAndRoles,
  getByTagsAndRoles,
  getByDashId
}

var MODULE_NAME = 'Dashboard Subscriptions - '

const path = require('path')
const uuid = require('uuid/v4')

const DB = require('sint-bit-utils/utils/dbCouchbase')
var CONFIG = require('./config')
var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/subscriptionsMutations') })

const auth = require('sint-bit-utils/utils/auth')

// var dashboards = require('./methods')
var guestSubscription = (dashId, userId) => ({id: '0_0', roleId: 'guest', dashId, userId, meta: {confirmed: true}, permissions: []})

async function getByDashIdAndUserId (dashId, userId) {
  try {
    var result = await DB.query('subscriptionsViews', 'SELECT item.* FROM subscriptionsViews item WHERE dashId=$1 AND userId=$2 LIMIT 1', [dashId, userId])
    return result && result[0] ? result[0] : null
  } catch (error) { throw new Error('problems during getByDashIdAndUserId ' + error) }
}
async function listByDashId (dashId, select = ['notifications', 'userId', 'tags', 'roleId']) {
  try {
    var result = await DB.query('subscriptionsViews', 'SELECT ' + select.join(',') + ' FROM subscriptionsViews item WHERE dashId=$1', [dashId])
    return result
  } catch (error) { throw new Error('problems during listByDashId ' + error) }
}
async function listByDashIdTagsRoles (reqData = {}, meta = {directCall: true}, getStream = null) {
  if (!reqData.select)reqData.select = ['id', 'dashId', 'roleId', 'userId']
  var results = await DB.query('subscriptionsViews', 'SELECT ' + reqData.select.join(',') + ' FROM subscriptionsViews  WHERE dashId=$1 AND (ARRAY_LENGTH(ARRAY_INTERSECT(tags,$2)) > 0 OR roleId IN $3 )', [reqData.dashId, reqData.tags, reqData.roles])
  CONSOLE.hl('query results', results)
  return results
}
async function listByUserId (userId) {
  try {
    // CREATE INDEX subscriptionsViewsUserId ON subscriptionsViews  (userId)
    CONSOLE.hl('listByUserId', userId)
    var result = await DB.query('subscriptionsViews', 'SELECT item.* FROM subscriptionsViews item WHERE userId=$1 LIMIT 1', [userId])
    return result || null
  } catch (error) { throw new Error('problems during listByUserId ' + error) }
}
async function listLast (reqData = {}, meta = {directCall: true}, getStream = null) {
  var dashId = reqData.dashId
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var canReadHiddenSubscriptions = false
  var canInfo = await can(dashId, userId, 'subscriptionsReads')
  var subscriptionRole = canInfo.role
  canReadHiddenSubscriptions = (subscriptionRole.permissions.indexOf('subscriptionsReadHidden') !== -1)
  var result
  var limit = reqData.to || 20 - reqData.from || 0
  var offset = reqData.from
  CONSOLE.hl('listLast', {dashId, userId, limit, offset})
  if (canReadHiddenSubscriptions) {
    result = await DB.query('subscriptionsViews', 'SELECT item.* FROM subscriptionsViews item WHERE dashId=$1 ORDER BY item.meta.updated DESC LIMIT $2 OFFSET $3', [dashId, limit, offset])
  } else {
    result = await DB.query('subscriptionsViews', 'SELECT item.* FROM subscriptionsViews item WHERE dashId=$1 AND (item.userId=$4 OR (item.meta.deleted!=true AND item.meta.confirmed=true)) ORDER BY item.meta.updated DESC LIMIT $2  OFFSET $3', [dashId, limit, offset, userId])
  }
  return result
}

const can = async function (dashId, userId, can, role, subscriptionId) {
  try {
    var subscription
    if (subscriptionId)subscription = await getView(subscriptionId)
    else subscription = await getByDashIdAndUserId(dashId, userId)
    if (!subscription || subscription.meta.deleted || !subscription.meta.confirmed) subscription = guestSubscription(dashId, userId)
    CONSOLE.hl('can subscription', subscription, dashId, userId, can, role)
    if (!role)role = await dashboards.getDashRole(subscription.roleId, dashId)
    if (!role) throw new Error(`role ${subscription.roleId} not exists`)
    var rolePermissions = role.permissions || []
    CONSOLE.hl('can rolePermissions', role, rolePermissions)

    if (!rolePermissions || rolePermissions.indexOf(can) === -1) throw new Error('Dashboard Role ' + role.id + ' have no permissions to ' + can)
    return {subscription, role}
  } catch (error) { throw new Error('problems during can ' + error) }
}

const canBool = async function (dashId, userId, permission, role, subscriptionId) {
  try {
    await can(dashId, userId, permission, role, subscriptionId)
    return true
  } catch (error) {
    CONSOLE.hl('canBool error', error)
    return false
  }
}

const mutate = async function (args) {
  try {
    var mutation = mutationsPack.mutate(args)
    CONSOLE.debug('mutate', mutation)
    await DB.put('subscriptionsMutations', mutation.id, mutation)
    return mutation
  } catch (error) {
    throw new Error('problems during mutate a ' + error)
  }
}

const updateView = async function (id, mutations, isNew) {
  try {
    // var key = new Key(aerospikeConfig.namespace, aerospikeConfig.set, id)
    var rawView = await getView(id, null, false) || {}
    var view = mutationsPack.applyMutations(rawView, mutations)
    CONSOLE.hl('updateView state', view)
    view.meta = view.meta || {}
    view.meta.updated = Date.now()
    view.meta.created = view.meta.created || Date.now()
    CONSOLE.hl('updateView view', view)
    await DB.put('subscriptionsViews', id, view)
    return view
  } catch (error) { throw new Error('problems during updateView ' + error) }
}

const getView = async function (id, view = null) {
  try {
    if (!view) view = await DB.get('subscriptionsViews', id)
    if (!view) return null
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
  try {
    var id = reqData.id = uuid()
    var mutation = await mutate({data: reqData, objId: id, mutation: 'create', meta})
    await updateView(id, [mutation], true)
    return {success: `Subscription created`, id}
  } catch (error) { throw new Error('problems during createRaw ' + error) }
}
const create = async function (reqData, meta = {directCall: true}, getStream = null) {
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  if (!reqData.meta)reqData.meta = {}
  if (reqData.userId !== userId) {
    // ONLY ADMIN OR SUBSCRIPTION OWNER
    await can(reqData.dashId, userId, 'writeSubscriptions')
    if (!reqData.userId)reqData.userId = userId
    reqData.meta.confirmed = 1
  } else {
    if (await canBool(reqData.dashId, userId, 'subscribe')) reqData.meta.confirmed = 1
    else if (await canBool(reqData.dashId, userId, 'confirmSubscribe'))reqData.meta.confirmed = 0
    else throw new Error(reqData.dashId + ' ' + userId + '  can\'t subscribe')
  }
  if (!reqData.roleId)reqData.roleId = 'subscriber'
  var role = await dashboards.getDashRole(reqData.roleId, reqData.dashId)
  if (!role) throw new Error('Role not exists or is not active')
  CONSOLE.hl('role', role)
  // NOT PUBLIC ROLES CAN BE ASSIGNED ONLY WITH WRITE PERMISSIONS
  if (parseInt(role.public) !== 1) await can(reqData.dashId, userId, 'writeSubscriptions')

  // var dashData = dashboards.readDashboard(reqData.dashId)
  CONSOLE.hl('create data', reqData)
  var returnResults = await createRaw(reqData, meta)
  return returnResults
}
async function confirm (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var currentState = await getView(id)
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  await can(currentState.dashId, userId, 'confirmSubscriptions')
  var mutation = await mutate({data: reqData, objId: id, mutation: 'postsConfirm', meta})
  var view = await updateView(id, [mutation])
  return {success: MODULE_NAME + ` confirmed`}
}

async function read (reqData, meta = {directCall: true}, getStream = null) {
  var id = reqData.id
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  CONSOLE.hl('read ', {reqData, userId})
  var currentState = reqData.rawView || await getView(id)
  CONSOLE.hl('subscriptionsRead', currentState)
  if (!currentState) {
    if (reqData.guestIfNull && reqData.dashId && reqData.userId)currentState = guestSubscription(reqData.dashId, reqData.userId)
    else return null
  }
  if (currentState.meta.deleted || !currentState.meta.confirmed) {
    await can(currentState.dashId, userId, 'subscriptionsReadHidden')
  }
  if (reqData.loadDash)currentState.dashboard = await dashboards.getDashboardInfo(currentState.dashId)
  if (reqData.loadUser)currentState.user = await netClient.rpc('readUser', {id: currentState.userId}, meta)

  if (currentState.userId !== userId) {
    await can(currentState.dashId, userId, 'subscriptionsRead')
  }

  return currentState
}

async function readByDashIdAndUserId (reqData, meta = {directCall: true}, getStream = null) {
  var dashId = reqData.dashId
  var userId = reqData.userId
  var subscription = await getByDashIdAndUserId(dashId, userId)
  if (!subscription)subscription = {id: '0_0', roleId: 'guest', dashId, userId, meta: {confirmed: true}, permissions: []}
  subscription.role = await dashboards.getDashRole(subscription.roleId, dashId)
  return subscription
}

async function update (reqData, meta = {directCall: true}, getStream = null) {
  CONSOLE.hl('update reqData', reqData)
  var id = reqData.id
  var currentState = await getView(id)
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  CONSOLE.hl('update currentState', {currentState, userId})
  if (currentState.userId !== userId) {
    // ONLY ADMIN OR SUBSCRIPTION OWNER
    await can(currentState.dashId, userId, 'writeSubscriptions')
  }
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
    var subscriptions = await listByUserId(userId)
    CONSOLE.hl('getExtendedByUserId listByUserId subscriptions', subscriptions)
    var results = await Promise.all(subscriptions.map(extendSubscription))
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
var netClient, CONSOLE, kvDbClient, dashboards

module.exports = {
  init: async function (setNetClient, setCONSOLE, setKvDbClient, setDashboards) {
    CONSOLE = setCONSOLE
    netClient = setNetClient
    dashboards = setDashboards

    await DB.init(CONFIG.couchbase.url, CONFIG.couchbase.username, CONFIG.couchbase.password)
    await DB.createIndex('subscriptionsViews', ['dashId', 'userId'])
    await DB.createIndex('subscriptionsViews', ['userId'])
  },
  getByDashIdAndUserId,
  can,
  createRaw,
  confirm,
  create,
  read,
  readByDashIdAndUserId,
  update,
  remove,
  getExtendedByUserId,
  listLast,
  listByDashIdTagsRoles,
  listByDashId
}

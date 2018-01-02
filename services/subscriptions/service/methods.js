const path = require('path')
const DB = require('sint-bit-utils/utils/dbCouchbaseV2')
var CONFIG = require('./config')
var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
const auth = require('sint-bit-utils/utils/auth')
var netClient

const log = (msg, data) => { console.log('\n' + JSON.stringify(['LOG', 'MAIN', msg, data])) }
const debug = (msg, data) => { console.log('\n' + JSON.stringify(['DEBUG', 'MAIN', msg, data])) }
const error = (msg, data) => { console.log('\n' + JSON.stringify(['ERROR', 'MAIN', msg, data])); console.error(data) }

const arrayToObjBy = (array, prop) => array.reduce((newObj, item) => { newObj[item[prop]] = item; return newObj }, {})

var itemId = (dashId, userId) => dashId + '_' + userId
var dashIdUserIdFromItemId = (itemId) => itemId.split('_')
var guestSubscription = (subscriptionId) => {
  var dashIdUserId = dashIdUserIdFromItemId(subscriptionId)
  debug('guestSubscription', {subscriptionId, dashId: dashIdUserId[0], userId: dashIdUserId[1]})
  return {id: subscriptionId, roleId: 'guest', dashId: dashIdUserId[0], userId: dashIdUserId[1], meta: {confirmed: true}, permissions: []}
}
var resultsError = (id, msg) => { return {id: id, __RESULT_TYPE__: 'error', error: msg} }

const updateViews = async function (mutations, views) {
  try {
    if (!views) {
      var ids = mutations.map((mutation) => mutation.objId)
      views = await getViews(ids)
    }
    views = views.map((view) => view || {})
    var viewsById = arrayToObjBy(views, 'id')
    var viewsToUpdate = []
    debug('updateViews', { views, mutations })
    mutations.forEach((mutation, index) => {
      var view = viewsById[mutation.objId] || {}
      view.meta = view.meta || {}
      view.meta.updated = Date.now()
      view.meta.created = view.meta.created || Date.now()
      viewsById[mutation.objId] = mutationsPack.applyMutations(view, [mutation])
      viewsToUpdate.push(viewsById[mutation.objId])
    })
    return await DB.upsertMulti('subscriptionsViews', viewsToUpdate)
  } catch (error) { throw new Error('problems during updateViews ' + error) }
}
const mutateAndUpdate = async function (mutation, dataToResolve, meta, views) {
  try {
    debug('mutateAndUpdate', {mutation, dataToResolve, views})
    var mutations = dataToResolve.map((mutationAndData) => mutationsPack.mutate({data: mutationAndData.data, objId: mutationAndData.id, mutation, meta}))
    DB.upsertMulti('subscriptionsMutations', mutations)
    return await updateViews(mutations, views)
  } catch (error) { throw new Error('problems during mutateAndUpdate ' + error) }
}

const getViews = async (ids, select = '*', guest = false) => {
  if (typeof ids !== 'object') { ids = [ids]; var single = true }
  var views = await DB.getMulti('subscriptionsViews', ids)
  if (guest)views = views.map((view, index) => view || guestSubscription(ids[index]))
  if (single) return views[0]
  else return views
}

var queueObj = () => {
  var resultsQueue = []
  var errorsIndex = []
  var dataToResolve = []
  return {
    dataToResolve,
    add: (id, data) => {
      var dataToResolveIndex = dataToResolve.push({ id, data }) - 1
      resultsQueue.push({id, __RESULT_TYPE__: 'resultsToResolve', index: dataToResolveIndex})
    },
    addError: (id, data, error) => {
      errorsIndex.push(resultsQueue.length)
      resultsQueue.push(resultsError(id, error))
    },
    resolve: async (func) => {
      if (dataToResolve.length) {
        var resolvedResults = await func(dataToResolve)
        resultsQueue = resultsQueue.map((data) => data.__RESULT_TYPE__ === 'resultsToResolve' ? resolvedResults[data.index] : data)
      }
    },
    returnValue: () => {
      var returnValue = {results: resultsQueue}
      if (errorsIndex.length)returnValue.errors = errorsIndex
      return returnValue
    }
  }
}
var rpcDashboardsReadMulti = (ids, meta) => netClient.rpcCall({to: 'dashboards', method: 'readMulti', data: {ids}, meta})
var dashboardsReadMulti = async(ids, meta) => {
  var response = await rpcDashboardsReadMulti(ids, meta)
  return response.results
}
var linkedDashboards = async function (idsOrItems, meta, userId, permissionsToCheck) {
  if (!Array.isArray(idsOrItems)) { idsOrItems = [idsOrItems]; var single = true }
  var ids = idsOrItems.map(item => typeof item === 'object' ? item.dashId : item).filter((v, i, a) => a.indexOf(v) === i)
  var dashboards = await dashboardsReadMulti(ids, meta)
  var byId = arrayToObjBy(dashboards, 'id')
  var userSubscriptionsIds = dashboards.map(dashboard => itemId(dashboard.id, userId))
  var userSubscriptions = await getViews(userSubscriptionsIds, '*', true)
  var userSubscriptionsByDashId = arrayToObjBy(userSubscriptions, 'dashId')
  var permissions = {}
  dashboards.forEach(dashboard => {
    permissions[dashboard.id] = dashboard.roles[userSubscriptionsByDashId[dashboard.id].roleId].permissions.reduce((acc, value) => Object.assign(acc, {[value]: true}), {})
  })
  return single ? { id: ids[0], dashboard: dashboards[0], permissions: permissions[dashboards[0].id] } : { ids, dashboards, permissions, byId }
}
var rpcUsersReadMulti = (ids, meta) => netClient.rpcCall({to: 'users', method: 'readMulti', data: {ids}, meta})
var usersReadMulti = async(ids, meta) => {
  var response = await rpcUsersReadMulti(ids, meta)
  return response.results
}
var linkedUsers = async function (idsOrItems, meta) {
  var ids = idsOrItems.map(item => typeof item === 'object' ? item.dashId : item).filter((v, i, a) => a.indexOf(v) === i)
  var users = await usersReadMulti(ids, meta)
  var byId = arrayToObjBy(users, 'id')
  return { ids, users, byId }
}
var basicMutationRequest = async function ({ids, dataArray, mutation, extend, meta, permissions, func}) {
  debug('basicMutationRequest', {ids, dataArray, mutation, extend, meta, permissions})
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  if (extend)dataArray = dataArray.map(data => Object.assign(data, extend))
  var currentStates = await getViews(ids, '*', false)
  debug('basicMutationRequest currentStates', {currentStates, userId, permissions})
  var dashboardsAndPermissions = await linkedDashboards(currentStates, meta, userId, permissions)
  var resultsQueue = queueObj()
  ids.forEach((id, index) => {
    var data = dataArray[index] || {id}
    var currentState = currentStates[index]
    var permissions = dashboardsAndPermissions.permissions[currentState.dashId || data.dashId]
    func(resultsQueue, data, currentState, userId, dashboardsAndPermissions[currentState.dashId || data.dashId], permissions)
  })
  await resultsQueue.resolve((dataToResolve) => mutateAndUpdate(mutation, dataToResolve, meta, currentStates))
  return resultsQueue.returnValue()
}

module.exports = {
  deleteMulti: async function (reqData, meta, getStream) {
    var func = (resultsQueue, data, currentState, userId, dashboard, permissions) => {
      if (!currentState) return resultsQueue.addError(data.id, data, 'Subscriptions not exists')
      if (!permissions['subscriptionsWrite']) {
        return resultsQueue.addError(data.id, data, 'User cant write subcriptions')
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequest({ids: reqData.ids, extend: reqData.extend, dataArray: [], meta, mutation: 'delete', permissions: ['subscriptionsWrite'], func})
  },
  init: async function (setNetClient) {
    netClient = setNetClient
    await DB.init(CONFIG.couchbase.url, CONFIG.couchbase.username, CONFIG.couchbase.password)
    await DB.createIndex('subscriptionsViews', ['dashId', 'userId'])
    await DB.createIndex('subscriptionsViews', ['userId'])
  },
  rawMutateMulti: async function (reqData, meta, getStream) {
    if (reqData.extend)reqData.items.forEach(item => Object.assign(item.data, reqData.extend))
    reqData.items.forEach(item => { if (!item.id && item.data.dashId && item.data.userId)item.id = item.data.id = itemId(item.data.dashId, item.data.userId) })
    var results = await mutateAndUpdate(reqData.mutation, reqData.items, meta)
    debug('rawMutateMulti', results)
    return {results}
  },
  createMulti: async function (reqData, meta, getStream) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    if (reqData.extend)reqData.items = reqData.items.map(item => Object.assign(item, reqData.extend))

    var ids = reqData.items.map(item => itemId(item.dashId, item.userId))
    var currentStates = await getViews(ids, '*', false)
    var dashboardsAndPermissions = await linkedDashboards(reqData.items, meta, userId, ['subscriptionsSubscribe', 'subscriptionsWrite', 'subscriptionsSubscribeWithConfimation'])
    var resultsQueue = queueObj()

    reqData.items.forEach((item, index) => {
      if (currentStates[index]) return resultsQueue.addError(item.id, currentStates[index], 'Subscription exists')
      item = Object.assign({id: itemId(item.dashId, item.userId), roleId: 'subscriber'}, item)
      var permissions = dashboardsAndPermissions.permissions[item.dashId]
      var role = dashboardsAndPermissions.byId[item.dashId].roles[item.roleId]
      if (!role) return resultsQueue.addError(item.id, item, 'Role not exists or is not active')
      if (!permissions['subscriptionsWrite']) {
        if (!role.public) return resultsQueue.addError(item.id, item, item.dashId + ' ' + userId + ' can\'t write role ' + item.roleId + '  subscriptions')
        if (item.userId === userId) {
          if (permissions['subscriptionsSubscribe'])item.meta.confirmed = 1
          else if (!permissions['subscriptionsSubscribeWithConfimation']) return resultsQueue.addError(item, item.dashId + ' ' + userId + ' can\'t subscribe')
        } else return resultsQueue.addError(item.id, item, item.dashId + ' ' + userId + ' can\'t create other users subscriptions')
      }
      resultsQueue.add(item.id, item)
    })

    await resultsQueue.resolve((dataToResolve) => mutateAndUpdate('create', dataToResolve, meta, currentStates))
    return resultsQueue.returnValue()
  },
  readMulti: async function (reqData, meta, getStream) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var currentStates = await getViews(reqData.ids, reqData.select || '*', false)
    var dashboardsAndPermissions = await linkedDashboards(currentStates, meta, userId, ['subscriptionsRead', 'subscriptionsReadHidden'])
    if (reqData.linkedViews && reqData.linkedViews.indexOf('user') !== -1) {
      var users = await linkedUsers(currentStates, meta)
    }
    debug('readMulti', {dashboardsAndPermissions, currentStates, users})
    var results = currentStates.map((currentState, index) => {
      if (!currentState) return resultsError(reqData.ids[index], 'Subscription not exists')
      if (!dashboardsAndPermissions.permissions[currentState.dashId]['subscriptionsReadHidden'] && currentState.userId !== userId && (currentState.meta.deleted || !currentState.meta.confirmed)) return resultsError(currentState.id, 'User cant read hidden subscriptions')
      if (reqData.linkedViews && reqData.linkedViews.indexOf('role') !== -1) currentState.role = dashboardsAndPermissions.byId[currentState.dashId].roles[currentState.roleId]
      if (reqData.linkedViews && reqData.linkedViews.indexOf('dashboard') !== -1) currentState.role = dashboardsAndPermissions.byId[currentState.dashId]
      if (reqData.linkedViews && reqData.linkedViews.indexOf('user') !== -1) currentState.user = users.byId[currentState.userId]
      return currentState
    })
    return {results}
  },
  updateMulti: async function (reqData, meta, getStream) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    if (reqData.extend)reqData.items = reqData.items.map(item => Object.assign(item, reqData.extend))
    var ids = reqData.items.map(item => item.id)
    var currentStates = await getViews(ids, '*', false)
    var dashboardsAndPermissions = await linkedDashboards(currentStates, meta, userId, ['subscriptionsWrite'])
    var resultsQueue = queueObj()
    debug('updateMulti', {dashboardsAndPermissions, currentStates})
    reqData.items.forEach((item, index) => {
      var currentState = currentStates[index]
      var permissions = dashboardsAndPermissions.permissions[currentState.dashId]
      if (!currentState) return resultsQueue.addError(item.id, item, 'Subscriptions not exists')
      if (!permissions['subscriptionsWrite']) return resultsQueue.addError(item.id, item, 'User cant write subcriptions')
      resultsQueue.add(item.id, item)
    })
    await resultsQueue.resolve((dataToResolve) => mutateAndUpdate('update', dataToResolve, meta, currentStates))
    return resultsQueue.returnValue()
  },
  list: async function (reqData, meta, getStream) {
    var dashId = reqData.dashId
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var dashboard = await linkedDashboards(dashId, meta, userId, ['subscriptionsRead', 'subscriptionsReadHidden'])
    if (!dashboard.permissions['subscriptionsRead']) { throw new Error('Cant read subscriptions from dashboard ' + dashId) }
    var results
    var offset = reqData.from || 0
    var limit = reqData.to || 20 - offset
    if (dashboard.permissions['subscriptionsReadHidden']) results = await DB.query('subscriptionsViews', 'SELECT item.* FROM subscriptionsViews item WHERE dashId=$1 ORDER BY item.meta.updated DESC LIMIT $2 OFFSET $3', [dashId, limit, offset])
    else results = await DB.query('subscriptionsViews', 'SELECT item.* FROM subscriptionsViews item WHERE dashId=$1 AND (item.userId=$4 OR (item.meta.deleted!=true AND item.meta.confirmed=true)) ORDER BY item.meta.updated DESC LIMIT $2  OFFSET $3', [dashId, limit, offset, userId])
    debug('list results', results)
    return {results}
  },
  confirm: async function (reqData, meta, getStream) {
    var id = reqData.id
    var currentState = await getView(id)
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    await can(currentState.dashId, userId, 'confirmSubscriptions')
    var mutation = await mutate({data: reqData, objId: id, mutation: 'postsConfirm', meta})
    var view = await updateView(id, [mutation])
    return {success: ` Dashboard Subscriptions - confirmed`}
  },
  can: async function (reqData, meta, getStream) {
    return can(subscription, permissionToCheck)
  }
  // getRawByDashIdAndUserId,
  // can,
  // createRaw,
  // confirm,
  // readByDashIdAndUserId,
  // getExtendedByUserId,
  // listLast,
  // listByDashIdTagsRoles: (reqData = {}, meta, getStream) => listRawByDashIdTagsRoles(reqData.dashId, reqData.tags, reqData.roles, reqData.select),
  // listByDashId: listRawByDashId,
  // listRawByDashId
}

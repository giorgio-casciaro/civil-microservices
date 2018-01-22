const path = require('path')
const uuidv4 = require('uuid/v4')
const DB = require('sint-bit-utils/utils/dbCouchbaseV3')
var CONFIG = require('./config')
var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
const auth = require('sint-bit-utils/utils/auth')
var netClient

const log = (msg, data) => { console.log('\n' + JSON.stringify(['LOG', 'MAIN', msg, data])) }
const debug = (msg, data) => { if (process.env.debugMain)console.log('\n' + JSON.stringify(['DEBUG', 'MAIN', msg, data])) }
const error = (msg, data) => { console.log('\n' + JSON.stringify(['ERROR', 'MAIN', msg, data])); console.error(data) }

const arrayToObjBy = (array, prop) => array.reduce((newObj, item) => { newObj[item[prop]] = item; return newObj }, {})

var resultsError = (item, msg) => { return {id: item.id || 'unknow', __RESULT_TYPE__: 'error', error: msg} }
var queueObj = require('sint-bit-utils/utils/queueObj')(resultsError)

var itemId = (item) => uuidv4()

// -----------------------------------------------------------------

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
    return await DB.upsertMulti('view', viewsToUpdate)
  } catch (error) { throw new Error('problems during updateViews ' + error) }
}
const mutateAndUpdate = async function (mutation, dataToResolve, meta, views) {
  try {
    debug('mutateAndUpdate', {mutation, dataToResolve, views})
    var mutations = dataToResolve.map((mutationAndData) => mutationsPack.mutate({data: mutationAndData.data, objId: mutationAndData.id, mutation, meta}))
    DB.upsertMulti('mutation', mutations)
    return await updateViews(mutations, views)
  } catch (error) { throw new Error('problems during mutateAndUpdate ' + error) }
}

const getViews = async (ids, select = '*', guest = false) => {
  if (typeof ids !== 'object') { ids = [ids]; var single = true }
  var views = await DB.getMulti(ids)
  if (single) return views[0]
  else return views
}

// var linkedSubscriptions = async function (idsOrItems, meta, userId, permissionsToCheck) {
//   if (!Array.isArray(idsOrItems)) { idsOrItems = [idsOrItems]; var single = true }
//   var dashIds = idsOrItems.filter(value => value).map(item => typeof item === 'object' ? item.dashId : item).filter((v, i, a) => a.indexOf(v) === i)
//   var items = dashIds.map((dashId) => ({dashId, userId}))
//   var subscriptions = await subscriptionsGetPermissions(items, meta)
//   var byDashId = arrayToObjBy(subscriptions, 'dashId')
//   var permissionsByDashId = {}
//   subscriptions.forEach((subscription) => {
//     // debug('linkedSubscriptions', subscription)
//     permissionsByDashId[subscription.dashId] = {}
//     subscription.permissions.forEach((item) => {
//       permissionsByDashId[subscription.dashId][item] = true
//     })
//   })
//   return single ? { dashId: dashIds[0], subscription: subscriptions[0], permissions: permissionsByDashId[dashIds[0]] } : { dashIds, byDashId, permissionsByDashId }
// }
// var subscriptionsGetPermissions = async (items, meta) => {
//   var response = await rpcSubscriptionsGetPermissions(items, meta)
//   return response.results
// }
// var rpcSubscriptionsGetPermissions = (items, meta) => netClient.rpcCall({to: 'subscriptions', method: 'getPermissions', data: {items}, meta})
var createMulti = async function (reqData, meta, getStream) {
  var ids = reqData.items.map(item => itemId(item))
  var func = async (resultsQueue, data, currentState, userId, permissions) => {
    // if (currentState) return resultsQueue.addError(data, 'Notifications exists')
    resultsQueue.add(data.id, data)
  }
  var response = await basicMutationRequestMulti({ids, extend: reqData.extend, dataArray: reqData.items, meta, mutation: 'create', func, loadViews: false})
  // await sendMail('notificationCreated', {to: reqData.email, from: CONFIG.mailFrom, subject: 'Benvenuto in CivilConnect - conferma la mail'}, Object.assign({CONFIG}, reqData))
  return response
}
var basicMutationRequestMulti = async function ({ids, dataArray, mutation, extend, meta, func, loadViews = true}) {
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var tokenData = await auth.getTokenDataFromToken(meta, CONFIG.jwt)
  // debug('basicMutationRequestMulti tokenData', {meta, jwt: CONFIG.jwt})
  var permissionsArray = tokenData.permissions || []
  var permissions = permissionsArray.reduce((accumulator, currentValue, currentIndex, array) => Object.assign(accumulator, {[currentValue]: true}), {})
  if (extend)dataArray = dataArray.map(data => Object.assign(data, extend))
  var currentStates = loadViews ? await getViews(ids, '*', false) : []
  debug('basicMutationRequestMulti currentStates', {tokenData, currentStates, userId, permissionsArray})
  var resultsQueue = queueObj()
  for (var index in ids) {
    var data = dataArray[index] || {id: ids[index]}
    data.id = ids[index]
    var currentState = currentStates[index]
    await func(resultsQueue, data, currentState, userId, permissions)
  }
  await resultsQueue.resolve((dataToResolve) => mutateAndUpdate(mutation, dataToResolve, meta, currentStates))
  return resultsQueue.returnValue()
}
var basicMutationRequest = async function ({id, data, mutation, meta, func}) {
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var tokenData = await auth.getTokenDataFromToken(meta, CONFIG.jwt)
  var permissionsArray = tokenData.permissions || []
  var permissions = permissionsArray.reduce((accumulator, currentValue, currentIndex, array) => Object.assign(accumulator, {[currentValue]: true}), {})
  debug('basicMutationRequest currentStates', {tokenData, permissions, userId, permissionsArray})
  var currentState = await getViews(id, '*', false)
  await func(data, currentState, userId, permissions)
  await mutateAndUpdate(mutation, [{id, data}], meta, [ currentState ])
}

module.exports = {
  deleteMulti: async function (reqData, meta, getStream) {
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Notifications not exists')
      debug('deleteMulti permissions', {id: currentState.id, userId, permissions})
      if (currentState.userId !== userId && !permissions['notificationsWrite']) {
        return resultsQueue.addError(data, `Notification ${userId} cant write notifications`)
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids: reqData.ids, extend: reqData.extend, dataArray: [], meta, mutation: 'delete', func})
  },
  confirmMulti: async function (reqData, meta, getStream) {
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Notifications not exists')
      debug('confirmMulti userId, permissions', { userId, permissions })
      if (!permissions['notificationsConfirm'] && !permissions['notificationsWrite']) {
        return resultsQueue.addError(data, `Notification ${userId} cant write notifications`)
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids: reqData.ids, extend: reqData.extend, dataArray: [], meta, mutation: 'confirm', func})
  },
  addTagsMulti: async function (reqData, meta, getStream) {
    var ids = reqData.items.map(item => item.id)
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Notifications not exists')
      if (currentState.userId !== userId && !permissions['notificationsWrite']) {
        return resultsQueue.addError(data, `Notification ${userId} cant write notifications`)
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids, extend: reqData.extend, dataArray: reqData.items, meta, mutation: 'addTags', func})
  },
  removeTagsMulti: async function (reqData, meta, getStream) {
    var ids = reqData.items.map(item => item.id)
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Notifications not exists')
      if (currentState.userId !== userId && !permissions['notificationsWrite']) {
        return resultsQueue.addError(data, `Notification ${userId} cant write notifications`)
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids, extend: reqData.extend, dataArray: reqData.items, meta, mutation: 'removeTags', func})
  },
  init: async function (setNetClient) {
    netClient = setNetClient
    log('CONFIG.couchbase', CONFIG.couchbase)
    await DB.init(CONFIG.couchbase.url, CONFIG.couchbase.username, CONFIG.couchbase.password, CONFIG.couchbase.bucket)
    await DB.createIndex(['objectId', 'userId'])
    await DB.createIndex(['DOC_TYPE'])
    // await DB.init(CONFIG.couchbase.url, CONFIG.couchbase.notificationname, CONFIG.couchbase.password)
    // // await DB.createIndex('notificationsViews', ['dashId', 'userId'])
    // await DB.createIndex('notificationsViews', ['objectId', 'userId'])
  },
  rawMutateMulti: async function (reqData, meta, getStream) {
    if (reqData.extend)reqData.items.forEach(item => Object.assign(item.data, reqData.extend))
    reqData.items.forEach(item => { if (!item.id)item.id = item.data.id = itemId(item) })
    debug('rawMutateMulti reqData', reqData)
    var results = await mutateAndUpdate(reqData.mutation, reqData.items, meta)
    debug('rawMutateMulti', results)
    return {results}
  },
  createMulti,
  readMulti: async function (reqData, meta, getStream) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var tokenData = await auth.getTokenDataFromToken(meta, CONFIG.jwt)
    var permissionsArray = tokenData.permissions || []
    var permissions = permissionsArray.reduce((accumulator, currentValue, currentIndex, array) => Object.assign(accumulator, {[currentValue]: true}), {})
    var currentStates = await getViews(reqData.ids, reqData.select || '*', false)
    var results = currentStates.map((currentState, index) => {
      if (!currentState) return resultsError({id: reqData.ids[index]}, 'Notification not exists')
      // var permissions = subscriptions.permissionsByDashId[currentState.dashId]
      // if (!permissions['notificationsRead']) return resultsError(currentState, 'Notification can\'t read notifications')
      if ((currentState.meta.deleted || !currentState.meta.confirmed) && !permissions['notificationsReadAll'] && currentState.userId !== userId) return resultsError(currentState, 'Notification cant read hidden notifications')
      return currentState
    })
    var errors = results.filter(value => value.__RESULT_TYPE__ === 'error').map((currentState, index) => index)
    debug('readMultireadMulti', {results, errors: errors.length ? errors : undefined})
    return {results, errors: errors.length ? errors : undefined}
  },
  updateMulti: async function (reqData, meta, getStream) {
    var ids = reqData.items.map(item => item.id)
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Notifications not exists')
      // if (!permissions['notificationsWrite']) return resultsQueue.addError(currentState, userId + ' can\'t write notifications')
      debug('updateMulti permissions', permissions)
      if (currentState.userId !== userId && !permissions['notificationsWrite']) return resultsQueue.addError(currentState, currentState.dashId + ' ' + userId + ' can\'t write notifications for other notifications')
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids, extend: reqData.extend, dataArray: reqData.items, meta, mutation: 'update', func})
  },
  list: async function (reqData, meta, getStream) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var tokenData = await auth.getTokenDataFromToken(meta, CONFIG.jwt)
    var permissionsArray = tokenData.permissions || []
    var permissions = permissionsArray.reduce((accumulator, currentValue, currentIndex, array) => Object.assign(accumulator, {[currentValue]: true}), {})
    if (!permissions['notificationsList']) throw new Error('user cant list notifications')
    // var subscription = await linkedSubscriptions(dashId, meta, userId)
    // if (!subscription.permissions['notificationsRead']) { throw new Error('Cant read notifications from notification ' + dashId) }
    var select = reqData.select || false
    var offset = reqData.from || 0
    var limit = reqData.to || 20 - offset
    var querySelect = select ? ' SELECT ' + select.join(',') + ' FROM notifications ' : ' SELECT item.* FROM notifications item '
    var queryWhere = ' where  DOC_TYPE="view"  '
    if (!permissions['notificationsReadAll'])queryWhere += ' AND (item.id=$1 OR ((item.meta.deleted IS MISSING OR item.meta.deleted=false) )) '
    var queryOrderAndLimit = ' ORDER BY item.meta.updated DESC LIMIT $2 OFFSET $3 '
    var results = await DB.query(querySelect + queryWhere + queryOrderAndLimit, [userId, limit, offset])
    debug('list results', results)
    return {results}
  },
  listByUserId: async function (reqData, meta, getStream) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var tokenData = await auth.getTokenDataFromToken(meta, CONFIG.jwt)
    var permissionsArray = tokenData.permissions || []
    var permissions = permissionsArray.reduce((accumulator, currentValue, currentIndex, array) => Object.assign(accumulator, {[currentValue]: true}), {})
    if (userId !== reqData.userId && !permissions['notificationsList']) throw new Error('user cant list notifications')
    // var subscription = await linkedSubscriptions(dashId, meta, userId)
    // if (!subscription.permissions['notificationsRead']) { throw new Error('Cant read notifications from notification ' + dashId) }
    var select = reqData.select || false
    var offset = reqData.from || 0
    var limit = reqData.to || 20 - offset
    var querySelect = select ? ' SELECT ' + select.join(',') + ' FROM `notifications` ' : ' SELECT item.* FROM `notifications` item ' // OR ARRAY_LENGTH(ARRAY_INTERSECT(item.toTags,$4)) > 0 OR ARRAY_CONTAINS(item.toRoles,$5)
    var queryWhere = ' WHERE DOC_TYPE="view" AND userId=$1 '
    // var querySelect = select ? ' SELECT ' + select.join(',') + ' FROM notificationsViews ' : ' SELECT item.* FROM notificationsViews item '
    // var queryWhere = ' where userId=$1 '
    if (!permissions['notificationsReadAll'])queryWhere += ' AND (item.meta.deleted IS MISSING OR item.meta.deleted=false) '
    var queryOrderAndLimit = ' ORDER BY item.meta.updated DESC LIMIT $2 OFFSET $3 '
    var results = await DB.query(querySelect + queryWhere + queryOrderAndLimit, [reqData.userId, limit, offset])
    debug('listByUserId results', results)
    return {results}
  },
  async readed (reqData, meta = {directCall: true}, getStream = null) {
    var id = reqData.id
    var func = (data, currentState, userId, permissions) => {
      if (!currentState) throw new Error('problems during set readed')
      if (!permissions['notificationsWrite'] && currentState.userId !== userId) throw new Error('user cant write for other notifications')
    }
    await basicMutationRequest({id, data: reqData, mutation: 'readed', meta, func})
    return {success: `Notification readed`}
  },
  postEvent: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    var notificationDefaults = { type: reqData.type, data: reqData.data, objectId: reqData.objectId || '' }
    var notifications = reqData.users.map((userId) => ({ userId }))
    return createMulti({items: notifications, extend: notificationDefaults}, meta)
  },
  async readedByObjectId (reqData, meta = {directCall: true}, getStream = null) {
    var objectId = reqData.objectId
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var results = await DB.query('SELECT id from notifications WHERE DOC_TYPE="view" AND objectId=$1 AND userId=$2 LIMIT 1', [objectId, userId])
    if (!results || !results[0] || !results[0].id) throw new Error('notification not founded')
    var id = results[0].id
    debug('readedByObjectId id', id)
    var func = (data, currentState, userId, permissions) => {
      debug('readedByObjectId currentState', currentState)
      if (!currentState) throw new Error('problems during set readed')
      if (!permissions['notificationsWrite'] && currentState.userId !== userId) throw new Error('user cant write for other notifications')
    }
    await basicMutationRequest({id, data: reqData, mutation: 'readed', meta, func})
    return {success: `Notification readed`}
  }
  // async updatePassword (reqData, meta = {directCall: true}, getStream = null) {
  //   var id = reqData.id
  //   if (reqData.password !== reqData.confirmPassword) throw new Error('Confirm Password not equal')
  //   var func = (data, currentState, userId, permissions) => {
  //     if (currentState.password && !bcrypt.compareSync(reqData.oldPassword, currentState.password)) throw new Error('Old Password not valid')
  //     if (!currentState || currentState.meta.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during updatePassword')
  //     debug('updatePersonalInfo', {userId, currentState})
  //     if (!permissions['notificationsWrite'] && currentState.userId !== userId) throw new Error('user cant write for other notifications')
  //   }
  //   var bcrypt = require('bcrypt')
  //   var data = {password: bcrypt.hashSync(reqData.password, 10)}
  //   await basicMutationRequest({id, data, mutation: 'updatePassword', meta, func})
  //   return {success: `Password updated`}
  // },
  // async addPic (reqData, meta = {directCall: true}, getStream = null) {
  //   const picLib = require('sint-bit-utils/utils/pic')
  //   var id = reqData.id
  //   var picId = uuidv4()
  //   var func = async (data, currentState, userId, permissions) => {
  //     try {
  //       if (!currentState || currentState.meta.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during addPic')
  //       if (!permissions['notificationsWrite'] && currentState.userId !== userId) throw new Error('user cant write for other notifications')
  //     } catch (error) {
  //       await new Promise((resolve, reject) => fs.unlink(reqData.pic.path, (err, data) => err ? resolve(err) : resolve(data)))
  //       throw error
  //     }
  //   }
  //   var picBuffers = await picLib.resizeAndGetBuffers(reqData.pic.path, CONFIG.uploadPath, [['mini', 100, 100]])
  //   var picData = {picId, sizes: {}}
  //   for (var size in picBuffers) {
  //     var picSizeId = uuidv4()
  //     picData.sizes[size] = picSizeId
  //     await DB.put('notificationsPics', picBuffers[size], picSizeId)
  //   }
  //   await DB.put('notificationsPics', {id: picId, userId: id, sizes: picData.sizes}, picId + '_meta')
  //
  //   // debug('addPic picBuffers', picBuffers)
  //   await basicMutationRequest({id, data: {pic: picData}, mutation: 'addPic', meta, func})
  //   return {success: `Pic Added`, data: picData}
  //   // var id = reqData.id
  //   // return await pic.updatePic(aerospikeConfig, kvDbClient, id, reqData.pic.path, CONFIG.uploadPath, [['mini', 100, 100]])
  // },
  // async getPic (reqData, meta = {directCall: true}, getStream = null) {
  //   var picMeta = await DB.get('notificationsPics', reqData.id + '_meta')
  //   if (!picMeta || picMeta.deleted) throw new Error('problems with picMeta')
  //   var currentState = await getViews(picMeta.userId)
  //   if (!currentState || currentState.meta.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during getPic')
  //   if (!picMeta.sizes || !picMeta.sizes[reqData.size]) throw new Error('problems with picSizeId')
  //   var picSizeId = picMeta.sizes[reqData.size]
  //   return DB.get('notificationsPics', picSizeId)
  //   // return await pic.getPic(aerospikeConfig, kvDbClient, reqData.id, reqData.size || 'mini')
  // },
  // async deletePic (reqData, meta = {directCall: true}, getStream = null) {
  //   var picMeta = await DB.get('notificationsPics', reqData.id + '_meta')
  //   if (!picMeta || picMeta.deleted) throw new Error('problems with picMeta')
  //   // var currentState = await getViews(picMeta.userId)
  //   var func = async (data, currentState, userId, permissions) => {
  //     if (!currentState || currentState.meta.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during deletePic')
  //     if (!permissions['notificationsWrite'] && currentState.userId !== userId) throw new Error('user cant write for other notifications')
  //   }
  //   await basicMutationRequest({id: picMeta.userId, data: {picId: reqData.id}, mutation: 'deletePic', meta, func})
  //   picMeta.deleted = true
  //   await DB.put('notificationsPics', picMeta, reqData.id + '_meta')
  //   return {success: `Pic Deleted`, data: picMeta}
  // },
  // async confirmEmail (reqData, meta = {directCall: true}, getStream = null) {
  //   var currentState = await getNotificationByMail(reqData.email)
  //   if (!currentState) throw new Error('email is confirmed or notification is not registered')
  //   if (currentState.emailConfirmationCode !== reqData.emailConfirmationCode) throw new Error('email confirmation code not valid')
  //   var id = currentState.id
  //   await mutateAndUpdate('confirmEmail', [{id, data: {}}], meta, [currentState])
  //   // // var mutation = await mutate({ data: {}, objId: id, mutation: 'confirmEmail', meta })
  //   // // await updateView(id, [mutation])
  //   // await addTag(id, 'emailConfirmed', meta)
  //   return {success: `Email confirmed`, data: {email: reqData.email}}
  // }
}

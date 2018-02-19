const path = require('path')
const uuidv4 = require('uuid/v4')
const DB = require('sint-bit-utils/utils/dbCouchbaseV3')
var CONFIG = require('./config')
var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
const auth = require('sint-bit-utils/utils/auth')
var netClient

process.env.debugMain = true
// process.env.debugCouchbase = true
// process.env.debugJesus = true
// process.env.debugSchema = true

const nodemailer = require('nodemailer')
const vm = require('vm')
const fs = require('fs')
const log = (msg, data) => { console.log('\n' + JSON.stringify(['LOG', 'MAIN', msg, data])) }
const debug = (msg, data) => { if (process.env.debugMain)console.log('\n' + JSON.stringify(['DEBUG', 'MAIN', msg, data])) }
const error = (msg, data) => { console.log('\n' + JSON.stringify(['ERROR', 'MAIN', msg, data])); console.error(data) }

const arrayToObjBy = (array, prop) => array.reduce((newObj, item) => { newObj[item[prop]] = item; return newObj }, {})

var resultsError = (item, msg) => { return {id: item.id || 'unknow', __RESULT_TYPE__: 'error', error: msg} }
var queueObj = require('sint-bit-utils/utils/queueObj')(resultsError)

var itemId = (item) => uuidv4()

// const getToken = async function (id, meta, jwt, permissions) {
//   // var permissions = await netClient.emit('getPermissions', {id}, meta)
//   return auth.createToken(id, permissions, meta, CONFIG.jwt)
// }
const getUserByMail = async function (email, filterGuest = true) {
  try {
    var results
    if (filterGuest)results = await DB.query('SELECT item.* FROM users item WHERE DOC_TYPE="view" AND email=$1 LIMIT 1', [email])
    else results = await DB.query('SELECT item.* FROM users item WHERE DOC_TYPE="view" AND email=$1 and guest IS MISSING OR guest=false LIMIT 1', [email])
    debug('getUserByMail', results, email)
    if (!results || !results[0]) return null
    else return results[0]
  } catch (error) { throw new Error('problems during getUserByMail ' + error) }
}

// -----------------------------------------------------------------

const updateViews = async function (mutations, views, returnViews) {
  try {
    if (!views) {
      var ids = mutations.map((mutation) => mutation.objId)
      views = await getViews(ids)
    }
    views = views.map((view) => view || {})
    var viewsById = arrayToObjBy(views, 'id')
    var viewsToUpdate = []
    debug('updateViews', { views, mutations, returnViews })
    mutations.forEach((mutation, index) => {
      var view = viewsById[mutation.objId] || {}
      view.VIEW_META = view.VIEW_META || {}
      view.VIEW_META.updated = Date.now()
      view.VIEW_META.created = view.VIEW_META.created || Date.now()
      viewsById[mutation.objId] = mutationsPack.applyMutations(view, [mutation])
      viewsToUpdate.push(viewsById[mutation.objId])
    })
    var results = await DB.upsertMulti('view', viewsToUpdate)
    debug('updateViews results', results)
    if (!results) return null
    results = results.map((result, index) => Object.assign(result, { mutation: mutations[index].mutation + '.' + mutations[index].version }))
    results.forEach((result, index) => {
      if (result.error) return null
      var mutation = mutations[index]
      debug('updateViews returnViews', { returnViews })
      if (returnViews)result.view = viewsById[result.id]
      netClient.emit('USERS_ENTITY_MUTATION', { id: result.id, mutation })//, dashId: view.dashId, toTags: view.toTags, toRoles: view.toRoles
    })
    debug('updateViews results expanded', { results, views: viewsToUpdate })

    return results
  } catch (error) { throw new Error('problems during updateViews ' + error) }
}

const mutateAndUpdate = async function (mutation, dataToResolve, meta, views, returnViews) {
  try {
    debug('mutateAndUpdate', {mutation, dataToResolve, views, returnViews})
    var mutations = dataToResolve.map((mutationAndData) => mutationsPack.mutate({data: mutationAndData.data, objId: mutationAndData.id, mutation, meta}))
    DB.upsertMulti('mutation', mutations)
    return await updateViews(mutations, views, returnViews)
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

var basicMutationRequestMulti = async function ({ids, dataArray, mutation, extend, meta, func, returnViews}) {
  var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
  var tokenData = await auth.getTokenDataFromToken(meta, CONFIG.jwt)
  // debug('basicMutationRequestMulti tokenData', {meta, jwt: CONFIG.jwt})
  var permissionsArray = tokenData.permissions || []
  var permissions = permissionsArray.reduce((accumulator, currentValue, currentIndex, array) => Object.assign(accumulator, {[currentValue]: true}), {})
  if (extend)dataArray = dataArray.map(data => Object.assign(data, extend))
  var currentStates = await getViews(ids, '*', false)
  debug('basicMutationRequestMulti currentStates', {tokenData, currentStates, userId, permissionsArray})
  var resultsQueue = queueObj()
  for (var index in ids) {
    var data = dataArray[index] || {id: ids[index]}
    data.id = ids[index]
    var currentState = currentStates[index]
    await func(resultsQueue, data, currentState, userId, permissions)
  }
  await resultsQueue.resolve((dataToResolve) => mutateAndUpdate(mutation, dataToResolve, meta, currentStates, returnViews))
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
      if (!currentState) return resultsQueue.addError(data, 'Users not exists')
      debug('deleteMulti permissions', {id: currentState.id, userId, permissions})
      if (currentState.id !== userId && !permissions['usersWrite']) {
        return resultsQueue.addError(data, `User ${userId} cant write users`)
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids: reqData.ids, extend: reqData.extend, dataArray: [], meta, mutation: 'delete', func})
  },
  confirmMulti: async function (reqData, meta, getStream) {
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Users not exists')
      debug('confirmMulti userId, permissions', { userId, permissions })
      if (!permissions['usersConfirm'] && !permissions['usersWrite']) {
        return resultsQueue.addError(data, `User ${userId} cant write users`)
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids: reqData.ids, extend: reqData.extend, dataArray: [], meta, mutation: 'confirm', func})
  },
  addTagsMulti: async function (reqData, meta, getStream) {
    var ids = reqData.items.map(item => item.id)
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Users not exists')
      if (currentState.id !== userId && !permissions['usersWrite']) {
        return resultsQueue.addError(data, `User ${userId} cant write users`)
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids, extend: reqData.extend, dataArray: reqData.items, meta, mutation: 'addTags', func})
  },
  removeTagsMulti: async function (reqData, meta, getStream) {
    var ids = reqData.items.map(item => item.id)
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Users not exists')
      if (currentState.id !== userId && !permissions['usersWrite']) {
        return resultsQueue.addError(data, `User ${userId} cant write users`)
      }
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids, extend: reqData.extend, dataArray: reqData.items, meta, mutation: 'removeTags', func})
  },
  init: async function (setNetClient) {
    netClient = setNetClient
    await DB.init(CONFIG.couchbase.url, CONFIG.couchbase.username, CONFIG.couchbase.password, CONFIG.couchbase.bucket)
    // await DB.createIndex('views', ['dashId', 'userId'])
    await DB.createIndex(['email'])
    await DB.createIndex(['guest'])
    await DB.createIndex(['VIEW_META.updated'])
    await DB.createIndex(['DOC_TYPE'])
  },
  rawMutateMulti: async function (reqData, meta, getStream) {
    if (reqData.extend)reqData.items.forEach(item => Object.assign(item.data, reqData.extend))
    reqData.items.forEach(item => { if (!item.id)item.id = item.data.id = itemId(item) })
    // debug('rawMutateMulti', reqData)
    var results = await mutateAndUpdate(reqData.mutation, reqData.items, meta)
    debug('rawMutateMulti', results)
    return {results}
  },
  createMulti: async function (reqData, meta, getStream) {
    var ids = reqData.items.map(item => itemId(item))
    var func = async (resultsQueue, data, currentState, userId, permissions) => {
      if (currentState) return resultsQueue.addError(data, 'Users exists')
      var mailExists = await getUserByMail(data.email)
      if (mailExists) return resultsQueue.addError(data, 'Users exists')
      data.emailConfirmationCode = uuidv4()
      resultsQueue.add(data.id, data)
    }
    var response = await basicMutationRequestMulti({ids, extend: reqData.extend, dataArray: reqData.items, meta, mutation: 'create', func, returnViews: true})
    debug('user createMulti', {response})
    var noErrorItems = response.results.filter(value => value.__RESULT_TYPE__ !== 'error')
    // var noErrorViews = response.views.filter((value, index) => response.results[index].__RESULT_TYPE__ !== 'error')
    var event = await netClient.emit('USERS_CREATED', {results: noErrorItems}, meta)
    debug('user createMulti', {noErrorItems, event})

    // await sendMail('userCreated', {to: reqData.email, from: CONFIG.mailFrom, subject: 'Benvenuto in CivilConnect - conferma la mail'}, Object.assign({CONFIG}, reqData))
    return {results: response.results}
  },
  readMulti: async function (reqData, meta, getStream) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var tokenData = await auth.getTokenDataFromToken(meta, CONFIG.jwt)
    var permissionsArray = tokenData.permissions || []
    var permissions = permissionsArray.reduce((accumulator, currentValue, currentIndex, array) => Object.assign(accumulator, {[currentValue]: true}), {})
    var currentStates = await getViews(reqData.ids, reqData.select || '*', false)
    var results = currentStates.map((currentState, index) => {
      if (!currentState) return resultsError({id: reqData.ids[index]}, 'User not exists')
      // var permissions = subscriptions.permissionsByDashId[currentState.dashId]
      // if (!permissions['usersRead']) return resultsError(currentState, 'User can\'t read users')
      if ((currentState.deleted || !currentState.confirmed) && !permissions['usersReadAll'] && currentState.id !== userId) return resultsError(currentState, 'User cant read hidden users')
      return currentState
    })
    var errors = results.filter(value => value.__RESULT_TYPE__ === 'error').map((currentState, index) => index)
    return {results, errors: errors.length ? errors : undefined}
  },
  rawReadMulti: async function (reqData, meta, getStream) {
    var results = await getViews(reqData.ids, reqData.select || '*', false)
    var errors = results.filter(value => value.__RESULT_TYPE__ === 'error').map((currentState, index) => index)
    return {results, errors: errors.length ? errors : undefined}
  },
  updateMulti: async function (reqData, meta, getStream) {
    var ids = reqData.items.map(item => item.id)
    var func = (resultsQueue, data, currentState, userId, permissions) => {
      if (!currentState) return resultsQueue.addError(data, 'Users not exists')
      // if (!permissions['usersWrite']) return resultsQueue.addError(currentState, userId + ' can\'t write users')
      debug('updateMulti permissions', permissions)
      if (currentState.id !== userId && !permissions['usersWrite']) return resultsQueue.addError(currentState, currentState.dashId + ' ' + userId + ' can\'t write users for other users')
      resultsQueue.add(data.id, data)
    }
    return basicMutationRequestMulti({ids, extend: reqData.extend, dataArray: reqData.items, meta, mutation: 'update', func})
  },
  list: async function (reqData, meta, getStream) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var tokenData = await auth.getTokenDataFromToken(meta, CONFIG.jwt)
    var permissionsArray = tokenData.permissions || []
    var permissions = permissionsArray.reduce((accumulator, currentValue, currentIndex, array) => Object.assign(accumulator, {[currentValue]: true}), {})
    if (!permissions['usersList']) throw new Error('user cant list users')
    // var subscription = await linkedSubscriptions(dashId, meta, userId)
    // if (!subscription.permissions['usersRead']) { throw new Error('Cant read users from user ' + dashId) }
    var select = reqData.select || false
    var offset = reqData.from || 0
    var limit = reqData.to || 20 - offset
    var querySelect = select ? ' SELECT ' + select.join(',') + ' FROM users ' : ' SELECT item.* FROM users item '
    var queryWhere = ' where DOC_TYPE="view" '
    if (!permissions['usersReadAll'])queryWhere += ' AND (item.id=$1 OR ((item.deleted IS MISSING OR item.deleted=false) )) '
    var queryOrderAndLimit = ' ORDER BY item.VIEW_META.updated DESC LIMIT $2 OFFSET $3 '
    var results = await DB.query(querySelect + queryWhere + queryOrderAndLimit, [userId, limit, offset])
    debug('list results', results)
    return {results}
  },
  async createGuest (reqData, meta = {directCall: true}, getStream = null) {
    var mailExists = await getUserByMail(reqData.email)
    if (mailExists) throw new Error('User mail exists')
    var id = uuidv4()
    var password = uuidv4()
    var data = {id: reqData.id, info: reqData.info, email: reqData.email, password: require('bcrypt').hashSync(password, 10)}
    var func = (data, currentState, userId, permissions) => {}
    await basicMutationRequest({id, data, mutation: 'createGuest', meta, func})
    var token = await auth.createToken(id, {permissions: [], guest: true}, CONFIG.jwt)
    return { success: `Guest User created`, id, data: {token, password} }
  },
  async logout (reqData, meta = {directCall: true}, getStream = null) {
    // var id = reqData.id
    // var currentState = await getView(id)
    // if (!currentState || currentState.deleted || currentState.tags.indexOf('passwordAssigned') < 0 || currentState.tags.indexOf('emailConfirmed') < 0) {
    //   throw new Error('user not active')
    // }
    // if (currentState.email !== reqData.email) throw new Error('Problems durig logout')
    // return {success: `Logout`, id, email: reqData.email}
    return {success: `Logout`, id: reqData.id}
  },
  async refreshToken (reqData, meta = {directCall: true}, getStream = null) {
    var token = await auth.refreshToken(meta.token, CONFIG.jwt)
    return {success: `New token generated`, token}
  },
  async readEmailConfirmationCode (reqData, meta = {directCall: true}, getStream = null) {
    var id = reqData.id
    var currentState = await getViews(id, ['emailConfirmationCode'], false)
    return {emailConfirmationCode: currentState.emailConfirmationCode}
  },
  async login (reqData, meta = {directCall: true}, getStream = null) {
    var bcrypt = require('bcrypt')
    var currentState = await getUserByMail(reqData.email)
    if (!currentState || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('Wrong username or password')
    if (!bcrypt.compareSync(reqData.password, currentState.password)) throw new Error('Wrong username or password')
    delete reqData.password
    var id = currentState.id
    var token = await auth.createToken(id, {permissions: currentState.permissions || []}, CONFIG.jwt)
    await mutateAndUpdate('login', [{id, data: {token}}], meta, [currentState])
    delete currentState.password
    debug('login', { success: `Login`, token, currentState })
    return { success: `Login`, token, currentState }
  },
  async assignPassword (reqData, meta = {directCall: true}, getStream = null) {
    if (reqData.password !== reqData.confirmPassword) throw new Error('Confirm Password not equal')
    var currentState = await getUserByMail(reqData.email)
    debug('assignPassword', currentState)
    if (!currentState || currentState.deleted || currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during assignPassword')
    var id = currentState.id
    var data = {password: require('bcrypt').hashSync(reqData.password, 10)}
    await mutateAndUpdate('assignPassword', [{id, data}], meta, [currentState])
    return {success: `Password assigned`}
  },
  async updatePersonalInfo (reqData, meta = {directCall: true}, getStream = null) {
    var id = reqData.id
    var func = (data, currentState, userId, permissions) => {
      if (!currentState || currentState.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during updatePersonalInfo')
      debug('updatePersonalInfo', {userId, currentState})
      if (!permissions['usersWrite'] && currentState.id !== userId) throw new Error('user cant write for other users')
    }
    await basicMutationRequest({id, data: reqData, mutation: 'updatePersonalInfo', meta, func})
    return {success: `Personal Info updated`}
  },
  async updatePassword (reqData, meta = {directCall: true}, getStream = null) {
    var id = reqData.id
    if (reqData.password !== reqData.confirmPassword) throw new Error('Confirm Password not equal')
    var func = (data, currentState, userId, permissions) => {
      if (currentState.password && !bcrypt.compareSync(reqData.oldPassword, currentState.password)) throw new Error('Old Password not valid')
      if (!currentState || currentState.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during updatePassword')
      debug('updatePersonalInfo', {userId, currentState})
      if (!permissions['usersWrite'] && currentState.id !== userId) throw new Error('user cant write for other users')
    }
    var bcrypt = require('bcrypt')
    var data = {password: bcrypt.hashSync(reqData.password, 10)}
    await basicMutationRequest({id, data, mutation: 'updatePassword', meta, func})
    return {success: `Password updated`}
  },
  async addPic (reqData, meta = {directCall: true}, getStream = null) {
    const picLib = require('sint-bit-utils/utils/pic')
    var id = reqData.id
    var picId = uuidv4()
    var func = async (data, currentState, userId, permissions) => {
      try {
        if (!currentState || currentState.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during addPic')
        if (!permissions['usersWrite'] && currentState.id !== userId) throw new Error('user cant write for other users')
      } catch (error) {
        await new Promise((resolve, reject) => fs.unlink(reqData.pic.path, (err, data) => err ? resolve(err) : resolve(data)))
        throw error
      }
    }
    var picBuffers = await picLib.resizeAndGetBuffers(reqData.pic.path, CONFIG.uploadPath, [['mini', 100, 100]])
    var picData = {picId, sizes: {}}
    for (var size in picBuffers) {
      var picSizeId = uuidv4()
      picData.sizes[size] = picSizeId
      await DB.put('pic', picBuffers[size], picSizeId)
    }
    await DB.put('pic', {id: picId, userId: id, sizes: picData.sizes}, picId + '_meta')
    // debug('addPic picBuffers', picBuffers)
    await basicMutationRequest({id, data: {pic: picData}, mutation: 'addPic', meta, func})
    return {success: `Pic Added`, data: picData}
    // var id = reqData.id
    // return await pic.updatePic(aerospikeConfig, kvDbClient, id, reqData.pic.path, CONFIG.uploadPath, [['mini', 100, 100]])
  },
  async getPic (reqData, meta = {directCall: true}, getStream = null) {
    var picMeta = await DB.get(reqData.id + '_meta')
    if (!picMeta || picMeta.deleted) throw new Error('problems with picMeta')
    var currentState = await getViews(picMeta.userId)
    if (!currentState || currentState.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during getPic')
    if (!picMeta.sizes || !picMeta.sizes[reqData.size]) throw new Error('problems with picSizeId')
    var picSizeId = picMeta.sizes[reqData.size]
    return DB.get(picSizeId)
    // return await pic.getPic(aerospikeConfig, kvDbClient, reqData.id, reqData.size || 'mini')
  },
  async deletePic (reqData, meta = {directCall: true}, getStream = null) {
    var picMeta = await DB.get(reqData.id + '_meta')
    if (!picMeta || picMeta.deleted) throw new Error('problems with picMeta')
    // var currentState = await getViews(picMeta.userId)
    var func = async (data, currentState, userId, permissions) => {
      if (!currentState || currentState.deleted || !currentState.passwordAssigned || !currentState.emailConfirmed) throw new Error('problems during deletePic')
      if (!permissions['usersWrite'] && currentState.id !== userId) throw new Error('user cant write for other users')
    }
    await basicMutationRequest({id: picMeta.userId, data: {picId: reqData.id}, mutation: 'deletePic', meta, func})
    picMeta.deleted = true
    await DB.put('pic', picMeta, reqData.id + '_meta')
    return {success: `Pic Deleted`, data: picMeta}
  },
  async confirmEmail (reqData, meta = {directCall: true}, getStream = null) {
    var currentState = await getUserByMail(reqData.email)
    if (!currentState) throw new Error('email is confirmed or user is not registered')
    if (currentState.emailConfirmationCode !== reqData.emailConfirmationCode) throw new Error('email confirmation code not valid')
    var id = currentState.id
    await mutateAndUpdate('confirmEmail', [{id, data: {}}], meta, [currentState])
    // // var mutation = await mutate({ data: {}, objId: id, mutation: 'confirmEmail', meta })
    // // await updateView(id, [mutation])
    // await addTag(id, 'emailConfirmed', meta)
    return {success: `Email confirmed`, data: {email: reqData.email}}
  },
  async  serviceInfo (reqData, meta = {directCall: true}, getStream = null) {
    var schema = require('./schema')
    var schemaOut = {}
    for (var i in schema.methods) if (schema.methods[i].public) schemaOut[i] = schema.methods[i].requestSchema
    var mutations = {}
    require('fs').readdirSync(path.join(__dirname, '/mutations')).forEach(function (file, index) { mutations[file] = require(path.join(__dirname, '/mutations/', file)).toString() })
    debug('serviceInfo', {schema, mutations})
    return {schema: schemaOut, mutations}
  }
}

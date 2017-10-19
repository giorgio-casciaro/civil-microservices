// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const path = require('path')
const uuid = require('uuid/v4')

const Aerospike = require('aerospike')
const Key = Aerospike.Key
const kvDb = require('sint-bit-utils/utils/kvDb')
const pic = require('sint-bit-utils/utils/pic')

const nodemailer = require('nodemailer')
const vm = require('vm')
const fs = require('fs')

const auth = require('sint-bit-utils/utils/auth')
var kvDbClient

const posts = require('./posts')

var service = function getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  try {
    CONSOLE.debug('CONFIG', CONFIG)
    CONSOLE.log('CONFIG', CONFIG)

    // SMTP
    var smtpTrans = nodemailer.createTransport(require('./config').smtp)
    const getMailTemplate = async (template, sandbox = { title: 'title', header: 'header', body: 'body', footer: 'footer' }, ext = '.html') => {
      var populate = (content) => vm.runInNewContext('returnVar=`' + content.replace(new RegExp('`', 'g'), '\\`') + '`', sandbox)
      var result = await new Promise((resolve, reject) => fs.readFile(path.join(__dirname, '/emails/', template + ext), 'utf8', (err, data) => err ? reject(err) : resolve(populate(data))))
      return result
    }
    const sendMail = async (template = 'dashboardCreated', mailOptions, mailContents) => {
      mailOptions.html = await getMailTemplate(template, mailContents, '.html')
      mailOptions.txt = await getMailTemplate(template, mailContents, '.txt')
      CONSOLE.log('sendMail', mailOptions)
      if (!process.env.sendEmails) return true
      return await new Promise((resolve, reject) => smtpTrans.sendMail(mailOptions, (err, data) => err ? reject(err) : resolve(data)))
    }

    // INIT
    //
    const init = async function () {
      try {
        kvDbClient = await kvDb.getClient(CONFIG.aerospike)
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, 'dbInitStatus')
        await kvDb.put(kvDbClient, key, {version: 0, timestamp: Date.now()})
        var dbInitStatus = await kvDb.get(kvDbClient, key)
        // if (!dbInitStatus) await kvDb.put(kvDbClient, key, {version: 0, timestamp: Date.now()})
        CONSOLE.log('dbInitStatus', dbInitStatus)
        // if (dbInitStatus.version === 1) return true
        if (dbInitStatus.version < 1) {
        //   CONSOLE.log('dbInitStatus v1', dbInitStatus)
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'created', index: CONFIG.aerospike.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'updated', index: CONFIG.aerospike.set + '_updated', datatype: Aerospike.indexDataType.NUMERIC })

          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.subscriptionsSet, bin: 'userId', index: CONFIG.aerospike.subscriptionsSet + '_userId', datatype: Aerospike.indexDataType.STRING })
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.subscriptionsSet, bin: 'dashId', index: CONFIG.aerospike.subscriptionsSet + '_dashId', datatype: Aerospike.indexDataType.STRING })
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.subscriptionsSet, bin: 'dashIdUserId', index: CONFIG.aerospike.subscriptionsSet + '_dashIdUserId', datatype: Aerospike.indexDataType.STRING })

          // await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.rolesSet, bin: 'dashId', index: CONFIG.aerospike.rolesSet + '_dashId', datatype: Aerospike.indexDataType.STRING })
        }
        await kvDb.put(kvDbClient, key, {version: 1, timestamp: Date.now()})
        await posts.init(CONSOLE, kvDbClient, subscriptionCan)
      } catch (error) {
        CONSOLE.log('problems during init', error)
        throw new Error('problems during init')
      }
    }
    // DASHBOARDS
    var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
    const mutate = async function (args) {
      try {
        var mutation = mutationsPack.mutate(args)
        CONSOLE.debug('mutate', mutation)
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, mutation.id)
        await kvDb.put(kvDbClient, key, mutation)
        return mutation
      } catch (error) {
        throw new Error('problems during mutate a ' + error)
      }
    }
    async function diffUpdatedView (oldState, newState) {
      var oldTags = oldState.tags ? oldState.tags : []
      var newTags = newState.tags ? newState.tags : []
      var op = Aerospike.operator
      var ops = []

      // REMOVED TAGS
      var removedTags = oldTags.filter(x => newTags.indexOf(x) < 0)
      ops = ops.concat(removedTags.map((tag) => op.incr('#' + tag, -1)))
      // ADDED TAGS
      var addedTags = newTags.filter(x => oldTags.indexOf(x) < 0)
      ops = ops.concat(addedTags.map((tag) => op.incr('#' + tag, 1)))
      CONSOLE.hl('diffUpdatedView', oldTags, newTags, removedTags, addedTags)
      CONSOLE.hl('diffUpdatedView ops', ops)

      await kvDb.operate(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.metaSet, 'dashboards_meta'), ops)
    }
    const updateView = async function (id, mutations, isNew, set) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, set || CONFIG.aerospike.set, id)
        var rawView = await getView(id, null, false) || {state: {}}
        var state = mutationsPack.applyMutations(rawView.state, mutations)
        var view = {
          updated: Date.now(),
          created: rawView.created || Date.now(),
          // email: state.email || '',
          id: state.id,
          tags: state.tags || [],
          state: JSON.stringify(state)
        }
        await kvDb.put(kvDbClient, key, view)
        await diffUpdatedView(rawView.state, state)
        return view
      } catch (error) { throw new Error('problems during updateView ' + error) }
    }

    const getView = async function (id, view = null, stateOnly = true) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        if (!view) view = await kvDb.get(kvDbClient, key)
        if (!view) return null
        if (view.state)view.state = JSON.parse(view.state)
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
    async function incrementDashboardsMetaCount () {
      var op = Aerospike.operator
      var ops = [
        op.incr('count', 1),
        op.read('count')
      ]
      var count = await kvDb.operate(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.metaSet, 'dashboards_meta'), ops)
      return count
    }
    async function getDashboardsMeta () {
      var dashboardsMeta = await kvDb.get(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.metaSet, 'dashboards_meta'))
      return dashboardsMeta
    }
    async function getDashboardInfo (id) {
      var currentState = await getView(id)
      if (!currentState || currentState.tags.indexOf('removed') >= 0) return null
      return {id: currentState.id, name: currentState.name, description: currentState.description, public: currentState.public, tags: currentState.tags, pics: currentState.pics || [], maps: currentState.maps || []}
    }
    // SUBSCRIPTIONS
    const mutateSubscription = async function (args) {
      try {
        var mutation = mutationsPack.mutate(args)
        CONSOLE.debug('mutate', mutation)
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.subscriptionsMutationsSet, mutation.id)
        await kvDb.put(kvDbClient, key, mutation)
        return mutation
      } catch (error) {
        throw new Error('problems during mutate a ' + error)
      }
    }
    async function diffSubscriptionUpdatedView (oldState, newState) {
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
      CONSOLE.hl('diffSubscriptionUpdatedView', oldTags, newTags, removedTags, addedTags, ops)
      await kvDb.operate(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.subscriptionsMetaSet, dashId + '_meta'), ops)
    }
    async function getDashSubscriptionsMeta (dashId) {
      var meta = await kvDb.get(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.subscriptionsMetaSet, dashId + '_meta'))
      return meta
    }
    function optimizeMeta (rawMeta) {
      if (!rawMeta)rawMeta = {}
      var optimizedMeta = {}
      optimizedMeta.count = rawMeta.count || 0
      var sortable = []
      for (var i in rawMeta) {
        if (i[0] === '#')sortable.push([i, rawMeta[i]])
      }
      sortable.sort(function (a, b) {
        return a[1] - b[1]
      })
      optimizedMeta.tags = sortable.slice(0, 30)
      return optimizedMeta
    }
    async function incrementDashSubscriptionsMetaCount (dashId) {
      var op = Aerospike.operator
      var ops = [
        op.incr('count', 1),
        op.read('count')
      ]
      var count = await kvDb.operate(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.subscriptionsMetaSet, dashId + '_meta'), ops)
      CONSOLE.hl('incrementDashSubscriptionsMetaCount', count)
      return count
    }
    const updateSubscriptionView = async function (id, mutations, isNew) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.subscriptionsSet, id)
        var rawView = await getSubscriptionView(id, null, false) || {state: {}}
        var state = mutationsPack.applyMutations(rawView.state, mutations)
        // CONSOLE.hl('updateSubscriptionView state', state)
        var view = {
          updated: Date.now(),
          created: rawView.created || Date.now(),
          id: state.id,
          dashId: state.dashId,
          dashIdUserId: `${state.dashId}${state.userId}`,
          userId: state.userId,
          tags: state.tags || [],
          role: state.role,
          state: JSON.stringify(state)
        }
        CONSOLE.hl('updateSubscriptionView view', view)
        await kvDb.put(kvDbClient, key, view)
        await diffSubscriptionUpdatedView(rawView.state, state)
        return view
      } catch (error) { throw new Error('problems during updateSubscriptionView ' + error) }
    }
    const getSubscriptionView = async function (id, view = null, stateOnly = true) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.subscriptionsSet, id)
        if (!view) view = await kvDb.get(kvDbClient, key)
        if (!view) return null
        if (view.state)view.state = JSON.parse(view.state)
        if (stateOnly) return view.state
        return view
      } catch (error) { throw new Error('problems during getSubscriptionView ' + error) }
    }
    const addSubscriptionTag = async function (id, tag, meta) {
      var mutation = await mutateSubscription({data: tag, objId: id, mutation: 'addTag', meta})
      await updateSubscriptionView(id, [mutation])
    }
    const removeSubscriptionTag = async function (id, tag, meta) {
      var mutation = await mutateSubscription({data: tag, objId: id, mutation: 'removeTag', meta})
      await updateSubscriptionView(id, [mutation])
    }
    const createRawSubscription = async function (reqData, meta = {directCall: true}, getStream = null) {
      var subscriptionsMeta = await incrementDashSubscriptionsMetaCount(reqData.dashId)
      if (!subscriptionsMeta)subscriptionsMeta = {count: 0}
      if (!subscriptionsMeta.count)subscriptionsMeta.count = 0
      var id = reqData.dashId + '_' + (subscriptionsMeta.count)
      CONSOLE.hl('createRawSubscription', id, reqData, subscriptionsMeta)
      reqData.id = id
      if (reqData.tags)reqData.tags = reqData.tags.map((item) => item.replace('#', ''))
      var mutation = await mutateSubscription({data: reqData, objId: id, mutation: 'create', meta})
      await updateSubscriptionView(id, [mutation], true)
      return {success: `Subscription created`, id}
    }
    const createSubscription = async function (reqData, meta = {directCall: true}, getStream = null) {
      var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
      if (!reqData.userId)reqData.userId = userId
      if (reqData.userId !== userId) {
        // ONLY ADMIN OR SUBSCRIPTION OWNER
        await subscriptionCan(reqData.dashId, userId, 'writeSubscriptions')
      }
      if (reqData.roleId) {
        // NOT PUBLIC ROLES CAN BE ASSIGNED ONLY WITH WRITE PERMISSIONS
        var role = await getRoleView(reqData.roleId)
        if (!role || role.tags.indexOf('removed') >= 0) {
          throw new Error('Role not exists or is not active')
        }
        if (parseInt(role.public) !== 1) await subscriptionCan(reqData.dashId, userId, 'writeSubscriptions', role)
      }
      var returnResults = await createRawSubscription(reqData, meta)
      return returnResults
    }
    const readSubscription = async function (id, userId, subscription) {
      CONSOLE.hl('readSubscription', id, userId, subscription)
      var currentState = await getSubscriptionView(id)
      CONSOLE.hl('readSubscription', id, userId, subscription)
      if (!currentState || currentState.tags.indexOf('removed') >= 0) return null
      return currentState
    }
    const getSubscriptionByDashIdAndUserId = async function (dashId, userId) {
      try {
        CONSOLE.hl('getSubscriptionByDashIdAndUserId', `${dashId}${userId}`)
        var result = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.subscriptionsSet, (dbQuery) => {
          dbQuery.where(Aerospike.filter.equal('dashIdUserId', `${dashId}${userId}`))
        })
        if (!result[0]) return null
        return await getSubscriptionView(result[0].id, result[0])
      } catch (error) { throw new Error('problems during getSubscriptionByDashIdAndUserId ' + error) }
    }
    const subscriptionCan = async function (dashId, userId, can, role) {
      try {
        var subscription = await getSubscriptionByDashIdAndUserId(dashId, userId)
        CONSOLE.hl('subscriptionCan subscription', subscription, dashId, userId, can, role)
        if (!subscription) throw new Error('subscription not founded - ' + dashId + ' - ' + userId)
        var subscriptionRoleId = subscription.roleId
        if (!role)role = await getRoleView(subscriptionRoleId)
      // CONSOLE.hl('subscriptionCan role', role)
        var rolePermissions = role.permissions
        if (!rolePermissions || rolePermissions.indexOf(can) === -1) throw new Error('Dashboard Role ' + role.slug + ' have no permissions to ' + can)
        return subscription
      } catch (error) { throw new Error('problems during subscriptionCan ' + error) }
    }

    // ROLES
    const mutateRole = async function (args) {
      try {
        var mutation = mutationsPack.mutate(args)
        CONSOLE.debug('mutate', mutation)
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.rolesMutationsSet, mutation.id)
        await kvDb.put(kvDbClient, key, mutation)
        return mutation
      } catch (error) {
        throw new Error('problems during mutate a ' + error)
      }
    }
    const getRoleView = async function (id, view = null, stateOnly = true) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.rolesSet, id)
        if (!view) view = await kvDb.get(kvDbClient, key)
        if (!view) return null
        if (view.state)view.state = JSON.parse(view.state)
        if (stateOnly) return view.state
        return view
      } catch (error) { throw new Error('problems during getRoleView ' + error) }
    }
    const updateRoleView = async function (id, mutations, isNew) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.rolesSet, id)
        var rawView = await getRoleView(id, null, false) || {state: {}}
        var state = mutationsPack.applyMutations(rawView.state, mutations)
        var view = {
          updated: Date.now(),
          created: rawView.created || Date.now(),
          id: state.id,
          dashId: '' + state.dashId,
          state: JSON.stringify(state),
          tags: state.tags || []
        }
        await kvDb.put(kvDbClient, key, view)
        return view
      } catch (error) { throw new Error('problems during updateRoleView ' + error) }
    }
    const addRoleTag = async function (id, tag, meta) {
      var mutation = await mutateRole({data: tag, objId: id, mutation: 'addTag', meta})
      await updateRoleView(id, [mutation])
    }
    const removeRoleTag = async function (id, tag, meta) {
      var mutation = await mutateRole({data: tag, objId: id, mutation: 'removeTag', meta})
      await updateRoleView(id, [mutation])
    }
    const createRawRole = async function (reqData, meta = {directCall: true}, getStream = null) {
      var id = uuid()
      reqData.id = id
      CONSOLE.hl('createRole', reqData)
      if (reqData.tags)reqData.tags = reqData.tags.map((item) => item.replace('#', ''))
      var mutation = await mutateRole({data: reqData, objId: id, mutation: 'create', meta})
      await updateRoleView(id, [mutation], true)
      return {success: `Role created`, id}
    }
    const getRolesByDashId = async function (dashId) {
      try {
        CONSOLE.hl('getRolesByDashId', dashId)
        var rawResults = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.rolesSet, (dbQuery) => {
          dbQuery.where(Aerospike.filter.equal('dashId', '' + dashId))
        })
        var results = await Promise.all(rawResults.map((result) => getRoleView(result.id, result)))
        results = results.filter((post) => post !== null)
        var resultsById = {}
        var result
        for (result of results) {
          resultsById[result.id] = result
        }
        return resultsById
      } catch (error) { throw new Error('problems during getRolesByDashId ' + error) }
    }

    // const subscribe = async function (dashId, userId, type) {
    //   var id = dashId + userId
    //   var DashUser = {id, dashId, userId, type, created: Date.now()}
    //   // var token = await auth.createToken(id, permissions, meta, CONFIG.jwt)
    //   var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.DashUsersSet, id)
    //   await kvDb.put(kvDbClient, key, DashUser)
    //   return {success: `subscribed`}
    // }
    // const checkDashUser = async function (dashId, userId, type) {
    //   var id = dashId + userId
    //   var DashUser = {id, dashId, userId, type, created: Date.now()}
    //   var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.DashUsersSet, id)
    //   var DashUser = await kvDb.get(kvDbClient, key)
    //   if (DashUser && DashUser.type === type) return true
    //   return false
    // }

    // await init()

    return {
      init,
      async getPermissions (reqData, meta = {directCall: true}, getStream = null) {
        // recuperare iscrizioni
        return { permissions: [ [10, 'dashboard.create', 1], [10, 'dashboard.read', 1] ] }
      },
      async create (reqData, meta = {directCall: true}, getStream = null) {
        var dashboardsMeta = await incrementDashboardsMetaCount()
        var id = dashboardsMeta.count
        reqData.id = id
        await auth.userCan('dashboard.create', meta, CONFIG.jwt)
        if (reqData.tags)reqData.tags = reqData.tags.map((item) => item.replace('#', ''))
        var mutation = await mutate({data: reqData, objId: id, mutation: 'create', meta})
        await updateView(id, [mutation], true)

        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)

        var roleAdmin = { dashId: id, slug: 'admin', name: 'Admin', public: 0, description: 'Main dashboard administrators', permissions: [ 'writeDashboard', 'readDashboard', 'writeSubscriptions', 'readSubscriptions', 'writeRoles', 'readRoles', 'writePosts', 'readPosts', 'writeOtherUsersPosts' ] }
        var createRoleAdmin = await createRawRole(roleAdmin, meta)
        var roleSubscriber = { dashId: id, slug: 'subscriber', name: 'Subscriber', public: 1, description: 'Dashboard subscribers', permissions: ['readDashboard', 'writePosts', 'readPosts', 'readSubscriptions', 'readRoles'] }
        var createRoleSubscriber = await createRawRole(roleSubscriber, meta)

        var subscription = { dashId: id, roleId: createRoleAdmin.id, role: 'admin', userId, tags: ['admin'] }
        var createAdminSubscription = await createRawSubscription(subscription, meta)
        CONSOLE.hl('createDashboard', {createRoleAdmin, createRoleSubscriber, createAdminSubscription})
        // var subscription = await createSubscription({userId, dashId: id}, meta)
        return {success: `Dashboard created`, id}
      },
      async info (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('dashboard.read', meta, CONFIG.jwt)
        var returnResults = await getDashboardInfo(id)
        return returnResults
      },
      async update (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        await subscriptionCan(id, userId, 'writeDashboard')
        if (reqData.tags)reqData.tags = reqData.tags.map((item) => item.replace('#', ''))
        var mutation = await mutate({data: reqData, objId: id, mutation: 'update', meta})
        await updateView(id, [mutation])
        return {success: `Dashboard updated`}
      },
      async read (reqData, meta = {directCall: true}, getStream = null) {
        CONSOLE.hl('dashboardsread', reqData)

        var id = reqData.id
        // CONSOLE.hl('dashboardsread2', id, await getView(id))

        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        await subscriptionCan(id, userId, 'readDashboard')
        var currentState = await getView(id)
        if (!currentState || currentState.tags.indexOf('removed') >= 0) {
          throw new Error('dashboard not active')
        }
        return currentState
      },
      async remove (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        await subscriptionCan(id, userId, 'writeDashboard')
        // checkDashUser(id, userId, 'admin')
        // await auth.userCan('dashboard.' + id + '.write.' + id, meta, CONFIG.jwt)
        await addTag(id, 'removed', meta)
        return {success: `Dashboard removed`}
      },
      async updatePic (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        try {
          var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
          await subscriptionCan(id, userId, 'writeDashboard')
        } catch (error) {
          await new Promise((resolve, reject) => fs.unlink(reqData.pic.path, (err, data) => err ? resolve(err) : resolve(data)))
          throw error
        }
        var picId = uuid()
        var returnResults = await pic.updatePic(CONFIG.aerospike, kvDbClient, picId, reqData.pic.path, CONFIG.uploadPath, [['mini', 100, 100], ['medium', 500, 500]])
        var mutation = await mutate({data: {picId}, objId: id, mutation: 'addPic', meta})
        await updateView(id, [mutation])
        // CONSOLE.hl('updatePic', await getView(id))
        return returnResults
      },
      async getPic (reqData, meta = {directCall: true}, getStream = null) {
        // CONSOLE.hl('getPic', reqData)
        var returnResults = await pic.getPic(CONFIG.aerospike, kvDbClient, reqData.id, reqData.size || 'mini')
        return returnResults
      },
      async queryByTimestamp (query = {}, meta = {directCall: true}, getStream = null) {
        // await auth.userCan('dashboard.read.query', meta, CONFIG.jwt)
        query = Object.assign({from: 0, to: 100000000000000}, query)
        var rawResults = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => { dbQuery.where(Aerospike.filter.range('updated', query.from, query.to)) })
        var results = await Promise.all(rawResults.map((result) => getView(result.id, result)))
        return results
      },
      async queryLastDashboards (reqData = {}, meta = {directCall: true}, getStream = null) {
        var dashboardsMeta = await getDashboardsMeta()
        CONSOLE.hl('queryLastDashboards', dashboardsMeta)
        if (!dashboardsMeta || !dashboardsMeta.count) return []
        reqData = Object.assign({from: 0, to: 20}, reqData)
        var rawIds = []
        for (var i = reqData.from; i < reqData.to; i++) {
          rawIds.push(dashboardsMeta.count - i)
        }
        CONSOLE.hl('queryLastDashboards', dashboardsMeta, rawIds)
        // return {}
        // await subscriptionCan(reqData.dashId, userId, 'readPosts')
        var results = await Promise.all(rawIds.map((id) => getDashboardInfo(id)))
        return results.filter((post) => post !== null)
      },
      async getDashboardsMeta (reqData = {}, meta = {directCall: true}, getStream = null) {
        var dashboardsMeta = optimizeMeta(await getDashboardsMeta())
        CONSOLE.hl('getDashboardsMeta', dashboardsMeta)
        return dashboardsMeta
      },
      async listPopular (query = {}, meta = {directCall: true}, getStream = null) {
      },
      async listActive (query = {}, meta = {directCall: true}, getStream = null) {
      },
      // ROLES
      async createRole (reqData, meta = {directCall: true}, getStream = null) {
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        await subscriptionCan(reqData.dashId, userId, 'writeRoles')
        var results = await createRawRole(reqData, meta)
        return results
      },
      async readRole (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getRoleView(id)
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        await subscriptionCan(currentState.dashId, userId, 'readRoles')
        if (!currentState || currentState.tags.indexOf('removed') >= 0) {
          throw new Error('Role not active')
        }
        return currentState
      },
      async updateRole (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getRoleView(id)
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        await subscriptionCan(currentState.dashId, userId, 'writeRoles')
        var mutation = await mutate({data: reqData, objId: id, mutation: 'update', meta})
        await updateRoleView(id, [mutation])
        return {success: `Role updated`}
      },
      async removeRole (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getRoleView(id)
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        CONSOLE.hl('removeRole', reqData, userId, currentState)
        await subscriptionCan(currentState.dashId, userId, 'writeRoles')
        await addRoleTag(id, 'removed', meta)
        return {success: `Role removed`}
      },
      // SUBSCRIPTIONS
      createSubscription,
      async readSubscription (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getSubscriptionView(id)
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        if (reqData.userId !== userId) {
          await subscriptionCan(currentState.dashId, userId, 'readSubscriptions')
        }
        if (!currentState || currentState.tags.indexOf('removed') >= 0) {
          throw new Error('Subscription not active')
        }
        return currentState
      },
      async readSubscriptions (reqData, meta = {directCall: true}, getStream = null) {
        var ids = reqData.ids
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        var results = []
        var checked = {}
        var currentState
        var id
        for (id of ids) {
          currentState = await getSubscriptionView(id)
          if (!checked[currentState.dashId + userId])checked[currentState.dashId + userId] = await subscriptionCan(currentState.dashId, userId, 'readSubscriptions')
          if (currentState && currentState.tags.indexOf('removed') < 0) {
            results.push(currentState)
          }
        }
        return results
      },
      async updateSubscription (reqData, meta = {directCall: true}, getStream = null) {
        CONSOLE.hl('updateSubscription reqData', reqData)
        var id = reqData.id
        var currentState = await getSubscriptionView(id)
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        if (currentState.userId !== userId) {
          // ONLY ADMIN OR SUBSCRIPTION OWNER
          await subscriptionCan(currentState.dashId, userId, 'writeSubscriptions')
        }
        if (reqData.roleId) {
          // NOT PUBLIC ROLES CAN BE ASSIGNED ONLY WITH WRITE PERMISSIONS
          var role = await getRoleView(reqData.roleId)
          if (!role || role.tags.indexOf('removed') >= 0) {
            throw new Error('Role not exists or is not active')
          }
          if (parseInt(role.public) !== 1) await subscriptionCan(currentState.dashId, userId, 'writeSubscriptions', role)
        }
        if (reqData.tags)reqData.tags = reqData.tags.map((item) => item.replace('#', ''))
        var mutation = await mutate({data: reqData, objId: id, mutation: 'update', meta})
        await updateSubscriptionView(id, [mutation])
        return {success: `Subscription updated`}
      },
      async removeSubscription (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getSubscriptionView(id)
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        if (currentState.userId !== userId) {
          // ONLY ADMIN OR SUBSCRIPTION OWNER
          await subscriptionCan(currentState.dashId, userId, 'writeSubscription')
        }
        await addSubscriptionTag(id, 'removed', meta)
        return {success: `Subscription removed`}
      },
      async getUserSubscriptions (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
          var rawResults = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.subscriptionsSet, (dbQuery) => {
            dbQuery.where(Aerospike.filter.equal('userId', userId))
          })
          CONSOLE.hl('getUserSubscriptions rawResults', rawResults)
          var results = []
          for (var i = 0; i < rawResults.length; i++) {
            results[i] = JSON.parse(rawResults[i].state)
            results[i].dashInfo = await getView(results[i].dashId)
            results[i].dashInfo.subscriptionsMeta = optimizeMeta(await getDashSubscriptionsMeta(results[i].dashId))
            results[i].dashInfo.postsMeta = optimizeMeta(await posts.getDashPostsMeta(results[i].dashId))
            results[i].dashInfo.roles = await getRolesByDashId(results[i].dashId)
            // results[i].dashInfo.roles = optimizeMeta(await posts.getDashPostsMeta(results[i].dashId))
          }
          return results
        } catch (error) { throw new Error('problems during getUserSubscriptions ' + error) }
      },
      async queryLastSubscriptions (reqData = {}, meta = {directCall: true}, getStream = null) {
        var dashId = reqData.dashId
        var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
        var subscription = await subscriptionCan(dashId, userId, 'readSubscriptions')

        var dashSubscriptionsMeta = await getDashSubscriptionsMeta(dashId)
        var dashSubscriptionsNumber = (dashSubscriptionsMeta.count || 0)
        reqData = Object.assign({from: 0, to: 20}, reqData)
        var rawIds = []
        for (var i = reqData.from; i < reqData.to; i++) {
          if (dashSubscriptionsNumber - i >= 0)rawIds.push(dashId + '_' + (dashSubscriptionsNumber - i))
        }
        CONSOLE.hl('queryLastSubscriptions', dashId, dashSubscriptionsNumber, userId, rawIds)
        // return {}
        // await subscriptionCan(reqData.dashId, userId, 'readPosts')
        var results = await Promise.all(rawIds.map((id) => readSubscription(id, userId, subscription)))
        CONSOLE.hl('queryLastSubscriptions results', results)
        results = results.filter((subscription) => subscription !== null)
        return results
      },
      // async queryLastDashboards (reqData = {}, meta = {directCall: true}, getStream = null) {
      //   var dashboardsMeta = await getDashboardsMeta()
      //   CONSOLE.hl('queryLastDashboards', dashboardsMeta)
      //   if (!dashboardsMeta || !dashboardsMeta.count) return []
      //   reqData = Object.assign({from: 0, to: 20}, reqData)
      //   var rawIds = []
      //   for (var i = reqData.from; i < reqData.to; i++) {
      //     rawIds.push(dashboardsMeta.count - i)
      //   }
      //   CONSOLE.hl('queryLastDashboards', dashboardsMeta, rawIds)
      //   // return {}
      //   // await subscriptionCan(reqData.dashId, userId, 'readPosts')
      //   var results = await Promise.all(rawIds.map((id) => getDashboardInfo(id)))
      //   return results.filter((post) => post !== null)
      // },
      // POSTS
      createPost: posts.create,
      readPost: posts.read,
      updatePost: posts.update,
      removePost: posts.remove,
      addPostPic: posts.addPic,
      getPostPic: posts.getPic,
      removePostPic: posts.removePic,
      queryLastPosts: posts.queryLastPosts,
      async test (query = {}, meta = {directCall: true}, getStream = null) {
        var results = await require('./tests/base.test')(netClient)
        CONSOLE.log('test results', results)
        return results
      }
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service

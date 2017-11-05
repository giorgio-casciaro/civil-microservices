var MODULE_NAME = 'Notifications - '

const path = require('path')
const uuid = require('uuid/v4')

const Aerospike = require('aerospike')
const Key = Aerospike.Key
const GeoJSON = Aerospike.GeoJSON
const kvDb = require('sint-bit-utils/utils/kvDb')

var CONFIG = require('./config')
var aerospikeConfig = CONFIG.aerospikeNotifications

const auth = require('sint-bit-utils/utils/auth')

var kvDbClient
var CONSOLE
var netClient

async function getUserMeta (userId) {
  var meta = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, userId + '_meta'))
  return meta
}
async function incrementUserMetaCount (userId) {
  var op = Aerospike.operator
  var ops = [
    op.incr('count', 1),
    op.read('count')
  ]
  var count = await kvDb.operate(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, userId + '_meta'), ops)
  CONSOLE.hl('incrementUserMetaCount', count)
  return count
}

module.exports = {
  init: async function (setNetClient, setCONSOLE, setKvDbClient) {
    CONSOLE = setCONSOLE
    kvDbClient = setKvDbClient
    netClient = setNetClient
    // DB INDEXES
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'created', index: aerospikeConfig.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'readed', index: aerospikeConfig.set + '_readed', datatype: Aerospike.indexDataType.NUMERIC })
    await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'objectIdUserId', index: aerospikeConfig.set + '_object_id_user_id', datatype: Aerospike.indexDataType.STRING })
  },
  create: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    CONSOLE.hl('kvDbClient', reqData)
    var notification = {
      type: reqData.type || '',
      created: Date.now(),
      objectId: reqData.objectId || '',
      data: reqData.data || {},
      readed: reqData.readed || 0
    }
    // reqData.users.forEach()
    var ids = await Promise.all(reqData.users.map(async function (userId) {
      var userMeta = await incrementUserMetaCount(userId) || {count: 0}
      notification.id = userId + '_' + userMeta.count
      notification.userId = userId
      notification.objectIdUserId = notification.objectId + '_' + userId
      await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, notification.id), notification)
      return notification.id
    }))

    return {success: 'Notifications created', ids}
  },
  read: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    if (!userId) throw new Error('invalid token')
    var notification = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, reqData.id))
    CONSOLE.hl('notification', userId, notification, reqData)
    if (userId !== notification.userId) throw new Error('invalid user')
    return notification
  },
  readed: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    if (!userId) throw new Error('invalid token')
    var notification = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, reqData.id))
    CONSOLE.hl('notification', userId, notification, reqData)
    if (userId !== notification.userId) throw new Error('invalid user')
    notification.readed = Date.now()
    await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, notification.id), notification)
    return {success: 'Notifications readed', id: notification.id}
  },
  readedByObjectId: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    if (!userId) throw new Error('invalid token')
    var objectIdUserId = reqData.objectId + '_' + userId
    var results = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
      dbQuery.where(Aerospike.filter.equal('objectIdUserId', objectIdUserId))
    })
    var ids = await Promise.all(results.map(async (result) => {
      result.readed = Date.now()
      await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, result.id), result)
      return result.id
    }))
    return {success: 'Notifications readedByObjectId', ids}
  },
  lastsByUserId: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    var userMeta = await getUserMeta(userId)
    var userMetaCount = (userMeta.count || 0)
    reqData = Object.assign({from: 0, to: 20}, reqData)
    var rawIds = []
    for (var i = reqData.from; i < reqData.to; i++) {
      if (userMetaCount - i >= 0)rawIds.push(userId + '_' + (userMetaCount - i))
    }
    CONSOLE.hl('queryLast', userId, userMetaCount, rawIds)

    var results = await Promise.all(rawIds.map((id) => {
      return kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, id))
    }))
    CONSOLE.hl('queryLast results', results)
    results = results.filter((subscription) => subscription !== null)
    return results
  }
}

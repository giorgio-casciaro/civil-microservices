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

const nodemailer = require('nodemailer')
var smtpTrans = nodemailer.createTransport(require('./config').smtp)

const sendMail = async (notification) => {
  // mailOptions={
  //   from: '"Fred Foo 👻" <foo@blurdybloop.com>',
  //   to: 'bar@blurdybloop.com, baz@blurdybloop.com',
  //   subject: 'Hello ✔',
  //   html:require('./emails/notification.html.js')(notification)
  //   text:require('./emails/notification.txt.js')(notification)
  // }
  // CONSOLE.log('sendMail', mailOptions)
  // if (!process.env.sendEmails) return true
  // var returnResult = await new Promise((resolve, reject) => smtpTrans.sendMail(mailOptions, (err, data) => err ? reject(err) : resolve(data)))
  // return returnResult
}
const sendSms = async (notification) => {
}
const sendFb = async (notification) => {
}

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
var setAsReaded = (id) => kvDb.operate(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, id), [Aerospike.operator.write('readed', Date.now())])

async function create (reqData = {}, meta = {directCall: true}, getStream = null) {
  CONSOLE.hl('notificationsCreate', reqData)
  var notification = {
    type: reqData.type,
    created: Date.now(),
    data: reqData.data,
    objectId: reqData.objectId || '',
    readed: reqData.readed || 0
  }
  // reqData.users.forEach()
  var ids = await Promise.all(reqData.users.map(async function (userInfo) {
    var userId = userInfo.userId
    var userMeta = await incrementUserMetaCount(userId) || {count: 0}
    notification.id = userId + '_' + userMeta.count
    notification.userIdObjectId = userId + '_' + notification.objectId
    notification.userId = userId
    notification.channels = userInfo.notifications || []
    await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, notification.id), notification)
    return notification.id
  }))
  netClient.emit('NOTIFICATION_CREATED', {data: notification, users: reqData.users})
  return {success: 'Notifications created', ids}
}

module.exports = {
  init: async function (setNetClient, setCONSOLE, setKvDbClient) {
    CONSOLE = setCONSOLE
    kvDbClient = setKvDbClient
    netClient = setNetClient
    // DB INDEXES
    var secondaryIndexCreated = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexCreated'))
    if (!secondaryIndexCreated) {
      await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'created', index: aerospikeConfig.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })
      await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexCreated'), {created: 1})
    }
    var secondaryIndexReaded = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexReaded'))
    if (!secondaryIndexReaded) {
      await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'readed', index: aerospikeConfig.set + '_readed', datatype: Aerospike.indexDataType.NUMERIC })
      await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexReaded'), {created: 1})
    }
    var secondaryIndexUserIdObjectId = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexUserIdObjectId'))
    if (!secondaryIndexUserIdObjectId) {
      await kvDb.createIndex(kvDbClient, { ns: aerospikeConfig.namespace, set: aerospikeConfig.set, bin: 'userIdObjectId', index: aerospikeConfig.set + '_userIdObjectId', datatype: Aerospike.indexDataType.STRING })
      await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.metaSet, 'secondaryIndexUserIdObjectId'), {created: 1})
    }
    CONSOLE.hl('INIT Secondary Index', {secondaryIndexCreated, secondaryIndexReaded, secondaryIndexUserIdObjectId})
  },
  create,
  read: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    if (!userId) throw new Error('invalid token')
    var notification = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, reqData.id))
    CONSOLE.hl('notification', userId, notification, reqData)
    if (userId !== notification.userId) throw new Error('invalid user')
    return notification
  },
  postEvent: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    CONSOLE.hl('Notifications postEvent', meta, reqData)
    var results = await create({type: meta.emit, data: reqData.view, objectId: reqData.view.id, users: reqData.users})
    CONSOLE.hl('Notifications postEvent results', results)
    return results
  },
  readed: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    if (!userId) throw new Error('invalid token')
    var notification = await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, reqData.id))
    CONSOLE.hl('notification', userId, notification, reqData)
    if (userId !== notification.userId) throw new Error('invalid user')
    // notification.readed = Date.now()
    // await kvDb.put(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, notification.id), notification)
    await setAsReaded(notification.id)
    return {success: 'Notifications readed', id: notification.id}
  },
  readedByObjectId: async function (reqData = {}, meta = {directCall: true}, getStream = null) {
    var userId = await auth.getUserIdFromToken(meta, CONFIG.jwt)
    if (!userId) throw new Error('invalid token')
    var userIdObjectId = userId + '_' + reqData.objectId
    var results = await kvDb.query(kvDbClient, aerospikeConfig.namespace, aerospikeConfig.set, (dbQuery) => {
      dbQuery.where(Aerospike.filter.equal('userIdObjectId', userIdObjectId))
    })
    await Promise.all(results.map((notification) => setAsReaded(notification.id)))
    // CONSOLE.hl('readedByObjectId', results, await kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, results[0].id)))
    return {success: 'Notifications readed'}
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
    CONSOLE.hl('listLast', userId, userMetaCount, rawIds)

    var results = await Promise.all(rawIds.map((id) => {
      return kvDb.get(kvDbClient, new Key(aerospikeConfig.namespace, aerospikeConfig.set, id))
    }))
    CONSOLE.hl('listLast results', results)
    results = results.filter((subscription) => subscription !== null)
    return results
  }
}

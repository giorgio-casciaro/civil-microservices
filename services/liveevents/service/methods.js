// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})
const auth = require('sint-bit-utils/utils/auth')

// const Aerospike = require('aerospike')
// const Key = Aerospike.Key
// const kvDb = require('sint-bit-utils/utils/kvDb')
//
// var kvDbClient
const vm = require('vm')
const EventEmitter = require('events')
class JesusProxyEventsEmitter extends EventEmitter {}
const jesusProxy = new JesusProxyEventsEmitter()
const bufferEventsDash = []
const bufferEventsUser = []
const maxBufferLength = 1000
function bufferEventsAdd (buffer, meta, event, timestamp) {
  buffer.unshift({meta, event, timestamp})
  if (buffer.length >= maxBufferLength) buffer.pop()
}
function bufferEventsGetFrom (buffer, timestamp) {
  return buffer.filter((obj) => obj.timestamp >= timestamp)
}

var service = function getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  try {
    // CONSOLE.debug('CONFIG', CONFIG)
    // CONSOLE.log('CONFIG', CONFIG)
    // INIT
    //
    var getRpcFunc = async function (rpc, req, meta) {
      var postCanBeReadScript = await netClient.rpc(rpc, req, meta)
      const postCanBeReadContext = { func: false }
      vm.createContext(postCanBeReadContext)
      vm.runInContext('func=' + postCanBeReadScript.func, postCanBeReadContext)
      return postCanBeReadContext.func
    }
    const init = async function () {
      try {

      } catch (error) {
        CONSOLE.log('problems during init', error)
        throw new Error('problems during init')
      }
    }
    return {
      init,
      async testEvent (query = {}, meta = {directCall: true}, getStream = null) {
        return {test: 'test'}
      },
      async triggerEvent (query = {}, meta = {directCall: true}, getStream = null) {
        trigger(query, meta)
        return {success: 'event triggered'}
      },
      async POST_MUTATIONS (query = {}, meta = {directCall: true}, getStream = null) {
        query.entity = 'post'
        query.type = 'mutations'
        var timestamp = Date.now()
        bufferEventsAdd(bufferEventsDash, meta, query, timestamp)
        jesusProxy.emit('dashEvent', {meta, query, timestamp})
        return {success: 'event triggered'}
      },
      async NOTIFICATION_CREATED (query = {}, meta = {directCall: true}, getStream = null) {
        CONSOLE.hl('NOTIFICATION_CREATED', {query})
        query.entity = 'notification'
        query.type = 'created'
        var timestamp = Date.now()
        bufferEventsAdd(bufferEventsUser, meta, query, timestamp)
        jesusProxy.emit('userEvent', {meta, query, timestamp})
        return {success: 'event triggered'}
      },
      async getDashEvents (query = {}, meta = {directCall: true}, getStream = null) {
        var subscriptionRequest = {}
        var dashId = query.dashId
        if (query.token) {
          var userId = await auth.getUserIdFromToken(query, CONFIG.jwt)
          if (userId)subscriptionRequest.userId = userId
          if (dashId)subscriptionRequest.dashId = dashId
          var subscription = await netClient.rpc('readSubscription', subscriptionRequest, meta)
        }

        // var postsExportCanBeRead = await getRpcFunc('postsExportCanBeRead', {}, meta)
        // CONSOLE.hl('getEvents postsExportCanBeRead', { postsExportCanBeRead, postsExportCanBeReadString: postsExportCanBeRead.toString()})

        CONSOLE.hl('getEvents subscription', {userId, dashId, subscription})
        const writeStream = (eventObj) => {
          CONSOLE.hl('stream.write', userId, eventObj.query.users)
          // if (eventObj.query.users && (!userId || !eventObj.query.users.find((user) => user.userId === userId))) return false
          if (eventObj.query.dashId && eventObj.query.dashId !== dashId) return false
          if (eventObj.query.toTags && eventObj.query.toTags.length && (!subscription || eventObj.query.toTags.filter((n) => subscription.tags.includes(n)).length === 0)) return false
          if (eventObj.query.toRoles && eventObj.query.toRoles.length && (!subscription || eventObj.query.toRoles.includes(subscription.roleId))) return false
          stream.write(eventObj.query)
        }
        const closeStream = () => {
          CONSOLE.hl('closed getStream')
          jesusProxy.removeListener('dashEvent', writeStream)
        }
        var stream = getStream(closeStream, query.timeout || 120000)
        if (query.fromTimestamp) {
          var oldEvents = bufferEventsGetFrom(bufferEventsDash, query.fromTimestamp)
          CONSOLE.hl('oldEvents', oldEvents)
          oldEvents.forEach(writeStream)
        }
        jesusProxy.on('dashEvent', writeStream)
        // writeStream({event: {'start': 1}, timestamp: Date.now()})
      },
      async getUserEvents (query = {}, meta = {directCall: true}, getStream = null) {
        if (query.token) {
          var userId = await auth.getUserIdFromToken(query, CONFIG.jwt)
        }
        const writeStream = (eventObj) => {
          CONSOLE.hl('stream.write', userId, eventObj.query.users)
          if (eventObj.query.users && (!userId || !eventObj.query.users.find((user) => user.userId === userId))) return false
          stream.write({
            entity: eventObj.query.entity,
            type: eventObj.query.type,
            data: eventObj.query.data
          })
        }
        const closeStream = () => {
          CONSOLE.hl('closed getStream')
          jesusProxy.removeListener('userEvent', writeStream)
        }
        var stream = getStream(closeStream, query.timeout || 120000)
        if (query.fromTimestamp) {
          var oldEvents = bufferEventsGetFrom(bufferEventsUser, query.fromTimestamp)
          CONSOLE.hl('oldEvents', oldEvents)
          oldEvents.forEach(writeStream)
        }
        jesusProxy.on('userEvent', writeStream)
        // writeStream({event: {'start': 1}, timestamp: Date.now()})
      }
    }
  } catch (error) {
    CONSOLE.hl('ERROR', error)
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service

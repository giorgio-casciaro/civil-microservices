// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

// const Aerospike = require('aerospike')
// const Key = Aerospike.Key
// const kvDb = require('sint-bit-utils/utils/kvDb')
//
// var kvDbClient
const EventEmitter = require('events')
class JesusProxyEventsEmitter extends EventEmitter {}
const jesusProxy = new JesusProxyEventsEmitter()
const maxBufferLength = 1000
var mainBuffer = {
  coeff: (1000 * 60 * 5),
  add (meta, event, timestamp) {
    // this.buffer.push({event, timestamp})
    this.buffer.unshift({meta, event, timestamp})
    if (this.buffer.length >= maxBufferLength) this.buffer.pop()
    // var roundedTimestamp = Math.floor(timestamp / this.coeff) * this.coeff
    // if (!this.buffer[roundedTimestamp]) this.buffer[roundedTimestamp] = []
    // this.buffer[roundedTimestamp].push({event, timestamp})
  },
  getFrom (timestamp) {
    // var coeff = 1000 * 60 * 5
    // var roundedTimestamp = Math.floor(timestamp / this.coeff) * this.coeff
    // if (this.buffer[roundedTimestamp]){
    //   this.buffer[roundedTimestamp].each(()=>)
    // }
    return this.buffer.filter((obj) => obj.timestamp >= timestamp)
  },
  buffer: []
}
var service = function getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  try {
    // CONSOLE.debug('CONFIG', CONFIG)
    // CONSOLE.log('CONFIG', CONFIG)
    // INIT
    //
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
        var timestamp = Date.now()
        CONSOLE.hl('triggerEvent', {query, timestamp})
        mainBuffer.add(meta, query, timestamp)
        jesusProxy.emit('jesusEvent', {meta, query, timestamp})
        return {success: 'event registered'}
      },
      async getEvents (query = {}, meta = {directCall: true}, getStream = null) {
        const writeStream = (eventObj) => {
          CONSOLE.hl('stream.write', eventObj)
          stream.write(eventObj)
        }
        const closeStream = () => {
          CONSOLE.hl('closed getStream')
          jesusProxy.removeListener('jesusEvent', writeStream)
        }
        var stream = getStream(closeStream, query.timeout || 120000)
        if (query.fromTimestamp) {
          var oldEvents = mainBuffer.getFrom(query.fromTimestamp)
          CONSOLE.hl('oldEvents', oldEvents)
          oldEvents.forEach(writeStream)
        }
        jesusProxy.on('jesusEvent', writeStream)
        // writeStream({event: {'start': 1}, timestamp: Date.now()})
      }
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service

var CONFIG = require('./config')
var netClient

process.env.debugMain = true
// process.env.debugCouchbase = true
// process.env.debugJesus = true
// process.env.debugSchema = true

const log = (msg, data) => { console.log('\n' + JSON.stringify(['LOG', 'MAIN', msg, data])) }
const debug = (msg, data) => { if (process.env.debugMain)console.log('\n' + JSON.stringify(['DEBUG', 'MAIN', msg, data])) }
const errorLog = (msg, data) => { console.log('\n' + JSON.stringify(['ERROR', 'MAIN', msg, data])); console.error(data) }

// -----------------------------------------------------------------
// const EventEmitter = require('events')
// class MicroserviceEventEmitter extends EventEmitter {}
// var microserviceEventEmitter = new MicroserviceEventEmitter()
var getEventsConnected = false
var getEventsConnectedHostnames = {}
var getEventsConnectedServices = {}
var serviceMethods = {
  init: async function (setNetClient) {
    netClient = setNetClient
  },
  call: {
    config: {public: false, stream: false, upload: false},
    request: {properties: {'service': {type: 'string'}, 'method': {type: 'string'}, 'data': {type: 'object'}}},
    response: false,
    exec: async function (reqData, meta = {directCall: true}, getStream = null) {
      // log('call start', {reqData})
      try {
        return netClient.rpc(reqData.service, reqData.method, reqData.data, meta)
      } catch (err) {
        return {error: 'call error', data: err}
      }
    }
  },
  echo: {
    config: {public: true, stream: false, upload: false},
    request: false,
    response: false,
    exec: async function (reqData, meta = {directCall: true}, getStream = null) {
      reqData.hostname = require('os').hostname()
      return reqData
    }
  },
  shutdown: {
    config: {public: true, stream: false, upload: false},
    request: false,
    response: false,
    exec: async function (reqData, meta = {directCall: true}, getStream = null) {
      log('SHUTDOWN')
      setTimeout(() => process.exit(1), 100)
      // process.exit(1)
      return true
    }
  },
  listen: {
    config: {public: true, stream: true, upload: false},
    request: false,
    response: false,
    exec: async function (reqData, meta = {directCall: true}, getStream = null) {
      var stream = getStream()
      var testEvents = await netClient.listen(reqData.host, reqData.method, reqData.data, reqData.asService, meta)
      testEvents.on('data', (data) => {
        try { stream.write(data) } catch (err) {
          stream.end(data)
        }
      })
    }
  }
}
module.exports = serviceMethods

process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})
var path = require('path')
var jesusClient = require('sint-bit-jesus/net.client')
process.env.debugJesus = true

var startTest = async function (netClient, getServiceSchema) {
  // var microRandom = Math.floor(Math.random() * 100000)
  var mainTest = require('sint-bit-utils/utils/microTest')('test Microservice local methods and db connections', 0)
  var microTest = mainTest.test
  var finishTest = mainTest.finish

  // FAKE CLIENT
  const getConsole = (serviceName, serviceId, pack) => require('sint-bit-utils/utils/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
  var fakeServiceName = 'liveeventsFakeClient'
  var CONSOLE = getConsole(fakeServiceName, '----', '-----')
  var DI = {
    serviceName: fakeServiceName,
    serviceId: fakeServiceName,
    CONSOLE,
    getMethods: () => {},
    getMethodsConfig: function (service = fakeServiceName, exclude) {
      if (service === fakeServiceName) return {}
      return getServiceSchema('methods', service)
    },
    getNetConfig: (service = fakeServiceName, exclude) => {
      if (service === fakeServiceName) {
        return {
          'channels': {
            'httpPublic': {
              'url': '127.0.0.1:10080',
              'cors': '127.0.0.1'
            },
            'http': { 'url': '127.0.0.1:10081' }
          }
        }
      }
      return getServiceSchema('net', service, exclude)
    },
    getEventsIn: (service = fakeServiceName, exclude) => {
      if (service === fakeServiceName) return {}
      return getServiceSchema('eventsIn', service, exclude)
    },
    getEventsOut: (service = fakeServiceName, exclude) => {
      CONSOLE.hl('getEventsOut', service, exclude)
      if (service === fakeServiceName) {
        return {
          'testEvent': {
            multipleResponse: true,
            requestSchema: {'additionalProperties': true, properties: {}},
            responseSchema: {'additionalProperties': true, properties: {}}
          },
          'testRemoteEvent': {
            multipleResponse: true,
            requestSchema: false,
            responseSchema: false
          }
        }
      }
      return getServiceSchema('eventsOut', service, exclude)
    },
    getRpcOut: (service = fakeServiceName, exclude) => {
      if (service === fakeServiceName) return {}
      return getServiceSchema('rpcOut', service, exclude)
    }
  }
  var fakeServiceNetClient = jesusClient(DI)

  // EXTEND TESTS
  const TYPE_OF = (actual, expected) => {
    if (typeof (expected) !== 'object') {
      var type = typeof (actual)
      if (Array.isArray(actual))type = 'array'
      return type
    }
    var filtered = {}
    Object.keys(expected).forEach((key) => { filtered[key] = typeof actual[key] })
    return filtered
  }
  const FILTER_BY_KEYS = (actual, expected) => {
    var filtered = {}
    Object.keys(expected).forEach((key) => { filtered[key] = actual[key] })
    return filtered
  }
  const COUNT = (actual, expected) => actual.length
  // TESTS
  // emit(event, data = {}, metaRaw = {}, timeout = false, channel = false)
  var testEvent = await fakeServiceNetClient.emit('testEvent', {}, {})
  microTest(testEvent, [{ test: 'test' }], 'testEvent', null)

  // // testLocalMethod (method, data = {}, meta = {}, timeout = false, channel = false) {
  // mainTest.log('PROVA')
  // var eventsStream = await netClient.testLocalMethod('getDashEvents', {dashId: 'testDash', timeout: 10000}, {})
  // mainTest.log('PROVA2')
  // // var eventsStream = netClient.testLocalMethod('getEvents', {timeout: 5000}, {})
  // var streamData = []
  // mainTest.log('PROVA3', eventsStream)
  // eventsStream.on('data', (data) => { mainTest.log('eventsStream streaming data', data); streamData.push(data) })
  // eventsStream.on('error', (data) => { mainTest.log('eventsStream streaming error', data); streamData.push(data) })
  // eventsStream.on('end', (data) => { mainTest.log('eventsStream streaming close', data); streamData.push(data) })
  // mainTest.log('PROVA3')
  //
  // // eventsStream.then((response) => {
  // //   microTest(response, 'string', 'eventsStream', TYPE_OF, 2, {})
  // // })
  // var timestamp = Date.now()
  // await new Promise(function (resolve) { setTimeout(resolve, 500) })
  //
  // await new Promise((resolve) => setTimeout(resolve, 1000))
  // var testRemoteEvent_1 = await fakeServiceNetClient.emit('testRemoteEvent', {testRemoteEvent: 1}, {})
  // mainTest.log('PROVA4')
  //
  // await new Promise((resolve) => setTimeout(resolve, 1000))
  // var testRemoteEvent_2 = await fakeServiceNetClient.emit('testRemoteEvent', {testRemoteEvent: 2}, {})
  //
  // await new Promise((resolve) => setTimeout(resolve, 1000))
  // var testRemoteEvent_3 = await fakeServiceNetClient.emit('testRemoteEvent', {testRemoteEvent: 3}, {})
  //
  // await new Promise(function (resolve) { setTimeout(resolve, 500) })
  // eventsStream.end()
  // microTest(streamData, 3, 'streamData', COUNT)
  //
  // streamData = []
  // eventsStream = await netClient.testLocalMethod('getDashEvents', {dashId: 'testDash', timeout: 10000, fromTimestamp: timestamp}, {})
  // eventsStream.on('data', (data) => { CONSOLE.hl('eventsStream streaming data', data); streamData.push(data) })
  // eventsStream.on('error', (data) => { CONSOLE.hl('eventsStream streaming error', data); streamData.push(data) })
  // eventsStream.on('end', (data) => { CONSOLE.hl('eventsStream streaming close', data); streamData.push(data) })
  //
  // await new Promise(function (resolve) { setTimeout(resolve, 500) })
  // eventsStream.end()
  // microTest(streamData, 3, 'streamData fromTimestamp', COUNT)
  //
  // // microTest(testEvent, [{ test: 'test' }], 'testEvent')
  // microTest(eventsStream, 'object', 'eventsStream', TYPE_OF, -1, {})

  return finishTest()
}
module.exports = startTest

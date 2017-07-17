process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var path = require('path')
const getConsole = (serviceName, serviceId, pack) => require('../lib/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var CONSOLE = getConsole("rpc and events", '----', '-----')
var microTest = require('../lib/microTest')('testEvents Microservice rpc and events')

var startTest = async function () {
  var SERVICE = require('../start')
  var CONFIG = require('../config')
  CONFIG.console.debug = true

  var meta = {}
  var timeout = 10000
  var response = await SERVICE.netClient.rpc('testRpcNoResponse', {'test_data': 1}, meta, timeout)
  CONSOLE.debug('testRpcAknowlegment response', response)
  microTest(response, null, 'testRpcNoResponse response=null on NoResponse')

  response = await SERVICE.netClient.rpc('testRpcAknowlegment', {'test_data': 1}, meta, timeout)
  CONSOLE.debug('testRpcAknowlegment response', response)
  microTest(response, { aknowlegment: 1 }, 'testRpcAknowlegment response={ aknowlegment: 1 } on testRpcAknowlegment')

  response = await SERVICE.netClient.rpc('testRpcResponse', {'test_data': 1}, meta, timeout)
  CONSOLE.debug('testRpcResponse response', response)
  microTest(response, {'test_data': 1}, 'testRpcResponse response as sended on testRpcResponse')

  var streaming = await SERVICE.netClient.rpc('testRpcStream', {'test_data': 1}, meta, timeout)
  var streamData = []
  CONSOLE.debug('testRpcStream streaming', streaming)
  streaming.on('data', (data) => streamData.push(data))
  streaming.on('error', (data) => CONSOLE.debug('streaming error', data))
  streaming.on('end', (data) => CONSOLE.debug('streaming close', data))
  await new Promise((resolve) => setTimeout(resolve, 1000))

  microTest(streamData, [{testStreamConnnected: 1}, {'test_data': 1}], 'testRpcStream streamData responses as sended')

  response = await SERVICE.netClient.emit('testEvent', {'eventTest_data': 1}, meta, timeout)
  console.log("response",response)

  microTest(response, {'eventTest_data': 1}, 'emit testEvent response as sended')

  SERVICE.netServer.stop()
  SERVICE.schemaClient.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // process.exit()
}
startTest()

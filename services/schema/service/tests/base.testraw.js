process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var path = require('path')
var request = require('request-promise-native')

var startTest = async function () {
  process.env.aerospikeSet = 'users_test_set'
  process.env.aerospikeMutationsSet = 'users_test_set'
  process.env.aerospikeViewsSet = 'users_test_set'
  process.env.consoleDebug = true
  process.env.sendEmails = false

  // await getAerospikeClient(require('../config').aerospike)
  var config = require('../config')
  var SERVICE = require('../start')
  await new Promise((resolve) => setTimeout(resolve, 1000))

  var microRandom = Math.floor(Math.random() * 100000)
  var mainTest = require('../lib/microTest')('test Microservice local methods and db conenctions', 0)
  var microTest = mainTest.test
  var finishTest = mainTest.finish

  var basicMeta = {}
  const TYPE_OF = (actual, expected) => {
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

  var setServiceSchema = await request.post(`http://${config.httpHost}:${config.httpPort}/setServiceSchema`, { form: { service: 'test', schema: JSON.stringify({ test_field: 'test' }) } })
  microTest(JSON.parse(setServiceSchema), {success: 'schema received'}, 'setServiceSchema')

  var getSchema = await request.get(`http://${config.httpHost}:${config.httpPort}/getSchema`)
  microTest(JSON.parse(getSchema), {test: { test_field: 'test' }}, 'getSchema')

  var removeServiceSchema = await request.post(`http://${config.httpHost}:${config.httpPort}/removeServiceSchema`, { form: { service: 'test' } })
  microTest(JSON.parse(removeServiceSchema), {success: 'schema removed'}, 'removeServiceSchema', undefined, 2)

  var getSchemaEmpty = await request.get(`http://${config.httpHost}:${config.httpPort}/getSchema`)
  microTest(JSON.parse(getSchemaEmpty), {}, 'getSchema Empty ')

  finishTest()
  SERVICE.server.connection.close()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()

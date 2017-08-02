process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})
var path = require('path')
var request = require('request-promise-native')

var startTest = async function () {
  var config = require('../config')
  var aerospike = require('../config').aerospike
  aerospike.set = 'users_test_set'
  aerospike.mutationsSet = 'users_test_mutations_set'
  aerospike.viewsSet = 'users_test_views_set'

  // PREPARE DB
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

  // process.exit()

  return finishTest()
}
module.exports = startTest

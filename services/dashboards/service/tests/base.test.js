process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})
var path = require('path')

var startTest = async function (netClient) {
  var aerospike = require('../config').aerospike
  aerospike.set = 'dashboards_test_set'
  aerospike.mutationsSet = 'dashboards_test_mutations_set'
  aerospike.viewsSet = 'dashboards_test_views_set'

  // PREPARE DB
  var microRandom = Math.floor(Math.random() * 100000)
  var mainTest = require('../lib/microTest')('test Microservice local methods and db connections', 0)
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

  var fields = {
    publicName: `sir test_user ${microRandom}. junior`,
    pic: {
      mimetype: 'image/png',
      path: path.join(__dirname, '/test_send.png')
    },
    email: `test${microRandom}@test${microRandom}.com`,
    password: `t$@es${microRandom}Tt$te1st_com`,
    newPassword: `new_t$@es${microRandom}Tt$te1st_com`,
    firstName: `t$@es${microRandom}Tt$te1st_com`,
    lastName: `t$@es${microRandom}Tt$te1st_com`
  }

  var create = await netClient.testLocalMethod('create', { email: fields.email }, basicMeta)
  microTest(create, { success: 'Dashboard created' }, 'Dashboard Create', FILTER_BY_KEYS)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  return finishTest()
}
module.exports = startTest

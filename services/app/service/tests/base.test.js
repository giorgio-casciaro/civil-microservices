process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var startTest = async function (netClient) {
  var basicMeta = {}

  // TEST FUNCTIONS
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

  var mainTest = require('sint-bit-utils/utils/microTest')('test Microservice local methods and db connections')
  var microTest = mainTest.test
  var finishTest = mainTest.finish

  const NC = netClient.testLocalMethod

  microTest(
      await NC('getSchema', {}, basicMeta),
      { schema: 'object' },
      'get all services schema',
      TYPE_OF
    )
  microTest(
        await NC('getPublicApiSchema', {}, basicMeta),
        { publicSchema: 'object' },
        'get Public Api Schema schema',
        TYPE_OF
      )
  microTest(
    await NC('proxy', {
      service: 'app',
      method: 'getSchema',
      data: {},
      meta: basicMeta
    }, basicMeta),
    { schema: 'object' },
    'get all services schema through proxy',
    TYPE_OF
  )

  await new Promise((resolve) => setTimeout(resolve, 1000))
  return finishTest()
}
module.exports = startTest

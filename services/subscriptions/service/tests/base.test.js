process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})
const log = (msg, data) => { console.log('\n' + JSON.stringify(['LOG', 'TEST', msg, data])) }
const warn = (msg, data) => { console.log('\n' + JSON.stringify(['WARN', 'TEST', msg, data])) }
const error = (msg, data) => { console.log('\n' + JSON.stringify(['ERROR', 'TEST', msg, data])) }

var startTest = async function (netClient) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  var CONFIG = require('../config')
  const auth = require('sint-bit-utils/utils/auth')
  var mainTest = require('sint-bit-utils/utils/microTest')('test Microservice local methods and db connections', 0)
  var microTest = mainTest.test
  var finishTest = mainTest.finish

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

  var token1 = await auth.createToken('token1', ['premission'], {test: true}, CONFIG.jwt)
  var token2 = await auth.createToken('token2', ['premission'], {test: true}, CONFIG.jwt)

  netClient.testPuppets.dashboards_info = ({data}) => {
    log('testPuppets dashboards_info', data)
  }

  netClient.testPuppets.dashboards_readMulti = ({data}) => {
    log('testPuppets dashboards_readMulti', data)
    return {
      results: [
        {
          id: 'testDash1',
          roles: {
            guest: puppetGuestRole,
            subscriber: puppetSubscriberRole,
            admin: puppetAdminRole
          }
        }
      ]
    }
  }
  netClient.testPuppets.users_readMulti = (args) => {
    log('testPuppets users_info', args)
    return {
      results: [
        {
          id: 'token1',
          name: 'Test User 1'
        }
      ]
    }
  }
  var subscriptions = {
    items: [{ dashId: 'testDash1', userId: 'token1' }],
    extend: {
      roleId: 'subscriber',
      tags: ['testTag'],
      notifications: ['email', 'sms', 'fb']
    }
  }

  var puppetGuestRole = {
    permissions: ['subscriptionsSubscribeWithConfimation', 'subscriptionsRead'],
    public: 1
  }
  var puppetSubscriberRole = {
    public: 1,
    permissions: ['subscriptionsSubscribe', 'subscriptionsSubscribeWithConfimation', 'subscriptionsWrite', 'subscriptionsRead']
  }
  var puppetAdminRole = {
    public: 1,
    permissions: ['subscriptionsSubscribe', 'subscriptionsSubscribeWithConfimation', 'subscriptionsWrite', 'subscriptionsRead']
  }

  const DB = require('sint-bit-utils/utils/dbCouchbaseV2')

  // mainTest.consoleResume()
  mainTest.consoleResume()
  log('createMulti DB delete', await DB.remove('subscriptionsViews', 'testDash1_token1'))
  // mainTest.consoleMute()
  var rawSubscriptions = {
    items: [{id: undefined, data: { dashId: 'testDash1', userId: 'token1' }}],
    extend: {
      roleId: 'subscriber',
      tags: ['testTag'],
      notifications: ['email', 'sms', 'fb']
    }
  }
  var rawCreateMulti = await netClient.testLocalMethod('rawMutateMulti', Object.assign({}, rawSubscriptions, {mutation: 'create'}), {token: token1})
  mainTest.consoleResume()
  log('rawCreateMulti', rawCreateMulti)
  log('rawCreateMulti DB read', await DB.get('subscriptionsViews', 'testDash1_token1'))
  mainTest.consoleMute()

  var createMulti = await netClient.testLocalMethod('createMulti', subscriptions, {token: token1})
  microTest(createMulti, {results: 'object'}, 'createMulti', TYPE_OF)
  mainTest.consoleResume()
  log('createMulti', createMulti)
  log('createMulti DB read', await DB.get('subscriptionsViews', 'testDash1_token1'))
  mainTest.consoleMute()

  var createMultiError1 = await netClient.testLocalMethod('createMulti', subscriptions, {token: token1})
  microTest(createMultiError1, {errors: 'object'}, 'createMultiError1 Subscription presente', TYPE_OF)
  mainTest.consoleResume()
  log('createMultiError1', createMultiError1)
  mainTest.consoleMute()

  var readMulti = await netClient.testLocalMethod('readMulti', { ids: ['testDash1_token1'] }, {token: token1})
  microTest(readMulti, {results: 'object'}, 'readMulti', TYPE_OF)
  mainTest.consoleResume()
  log('readMulti', readMulti)
  mainTest.consoleMute()

  // mainTest.consoleResume()
  var updateMulti = await netClient.testLocalMethod('updateMulti', { items: [{id: 'testDash1_token1', tags: ['test']}], extend: { roleId: 'admin' } }, {token: token1})
  microTest(updateMulti, {results: 'object'}, 'updateMulti', TYPE_OF)
  mainTest.consoleResume()
  log('updateMulti', updateMulti)
  log('updateMulti DB read', await DB.get('subscriptionsViews', 'testDash1_token1'))
  mainTest.consoleMute()

  var list = await netClient.testLocalMethod('list', { dashId: 'testDash1' }, {token: token1})
  microTest(list, {results: 'object'}, 'list', TYPE_OF)
  mainTest.consoleResume()
  log('list', list)
  mainTest.consoleMute()

  // mainTest.consoleResume()
  var deleteMulti = await netClient.testLocalMethod('deleteMulti', { ids: ['testDash1_token1'] }, {token: token1})
  microTest(deleteMulti, {results: 'object'}, 'deleteMulti', TYPE_OF)
  mainTest.consoleResume()
  log('deleteMulti', deleteMulti)
  log('deleteMulti DB read', await DB.get('subscriptionsViews', 'testDash1_token1'))
  mainTest.consoleMute()

  await new Promise((resolve) => setTimeout(resolve, 1000))
  return finishTest()
}
module.exports = startTest

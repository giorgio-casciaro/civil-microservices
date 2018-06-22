process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})
const log = (msg, data) => { console.log('\n' + JSON.stringify(['LOG', 'TEST', msg, data])) }
const warn = (msg, data) => { console.log('\n' + JSON.stringify(['WARN', 'TEST', msg, data])) }
const error = (msg, data) => { console.log('\n' + JSON.stringify(['ERROR', 'TEST', msg, data])) }

process.env.debugMain = true
// process.env.debugCouchbase = true
// process.env.debugJesus = true
// process.env.debugSchema = true

var startTest = async function (netClient) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  var CONFIG = require('../config')

  const auth = require('sint-bit-utils/utils/auth')
  var mainTest = require('sint-bit-utils/utils/microTest')('test Microservice local methods and db connections', 0)
  // mainTest.consoleResume()
  // function getPuppetSubscriptionsGetPermissions (substitutions = {}) {
  //   var defaultSubscription = Object.assign({
  //     id: 'testSubscription',
  //     permissions: ['usersWrite', 'usersRead', 'usersConfirm', 'usersWriteOtherUsers', 'usersReadAll'],
  //     dashId: 'testDash',
  //     userId: 'userTest'
  //   }, substitutions)
  //   // mainTest.log('getPuppetSubscriptionsGetPermissions', {substitutions, defaultSubscription})
  //   var func = function ({data}) { return { results: [defaultSubscription] } }
  //   return func
  // }

  async function setContext (contextData) {
    var i
    var tokens = {}
    for (i in contextData.users)tokens[i] = await auth.createToken(i, contextData.users[i], CONFIG.jwt)
    for (i in contextData.entities) await DB.put('view', Object.assign({ id: 'testDash_userTest', meta: {confirmed: true, created: Date.now(), updated: Date.now()}, dashId: 'testDash', roleId: 'subscriber', userId: 'userTest' }, contextData.entities[i]))
    Object.assign(netClient.testPuppets, contextData.testPuppets || {})
    return {
      tokens,
      data: contextData.data,
      updateData: (substitutions) => {
        var value
        for (var k in substitutions) {
          value = contextData.data
          k.split('/').forEach(addr => (value = value[addr]))
          value = substitutions[k]
        }
      },
      updatePuppets: (testPuppets) => Object.assign(netClient.testPuppets, testPuppets || {}),
      destroy: async() => {
        for (i in contextData.entities) await DB.remove('usersViews', contextData.entities[i].id)
      }
    }
  }
  const DB = require('sint-bit-utils/utils/dbCouchbaseV3')
  await DB.init(CONFIG.couchbase.url, CONFIG.couchbase.username, CONFIG.couchbase.password, CONFIG.couchbase.bucket)
  const dbGet = (id = 'userTest') => DB.get(id)
  const dbRemove = (id = 'userTest') => DB.remove(id)

  var microRandom = Math.floor(Math.random() * 100000)
  var testEmail = `test${microRandom}@test.com`

  mainTest.sectionHead('SERVICE INFO')
  var context = await setContext({ data: { }, users: { userTest: {permissions: ['dashboardsCreate']} }, entities: [] })
  var test = await netClient.testLocalMethod('serviceInfo', {}, {token: context.tokens.userTest})
  mainTest.testRaw('SERVICE INFO', test, (data) => data.schema instanceof Object && data.mutations instanceof Object)
  await context.destroy()

  mainTest.sectionHead('RAW CREATE')

  var context = await setContext({
    data: { mutation: 'create', items: [{id: undefined, data: { email: testEmail }}], extend: { } },
    users: { userTest: {} },
    entities: []
    // testPuppets: { subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions() }
  })
  var test = await netClient.testLocalMethod('rawMutateMulti', context.data, {token: context.tokens.userTest})
  mainTest.testRaw('rawMutateMulti create', test, (data) => data.results instanceof Array && data.results.length === 1)
  // mainTest.consoleResume()
  mainTest.testRaw('rawMutateMulti create dbCheck', await dbGet(test.results[0].id), (data) => data.email === testEmail)
  mainTest.log('rawMutateMulti', test)
  await dbRemove(test.results[0].id)
  await context.destroy()

  mainTest.sectionHead('REGISTRATION AND LOGIN')

  context = await setContext({
    data: { items: [{ email: testEmail, tags: ['testTag'] }] },
    users: { userTest: {} },
    entities: []
    // testPuppets: { subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions() }
  })
  // mainTest.consoleResume()

  // var results = await DB.query('usersViews', 'DELETE FROM usersViews WHERE email="test@test.com" LIMIT 1', [])
  // DELETE FROM usersViews WHERE email=testEmail
  test = await netClient.testLocalMethod('createMulti', context.data, {token: context.tokens.userTest})
  mainTest.testRaw('createMulti', test, (data) => data.results instanceof Array && data.results.length === 1 && !data.errors)
  mainTest.testRaw('createMulti dbCheck', await dbGet(test.results[0].id), (data) => data.email === testEmail && data.emailConfirmed === false && data.passwordAssigned === false)
  var resultId = test.results[0].id
  await new Promise((resolve) => setTimeout(resolve, 500))

  test = await netClient.testLocalMethod('createMulti', context.data, {token: context.tokens.userTest})
  mainTest.testRaw('createMulti wrong request: User exists', test, (data) => data.errors)

  test = await netClient.testLocalMethod('createMulti', context.data, {token: context.tokens.userTest})
  mainTest.testRaw('createMulti wrong request: email not valid', test, (data) => data.errors)

  test = await netClient.testLocalMethod('readEmailConfirmationCode', {id: resultId}, {token: context.tokens.userTest})
  mainTest.testRaw('readEmailConfirmationCode', test, (data) => data.emailConfirmationCode && !data.errors)

  test = await netClient.testLocalMethod('confirmEmail', {email: testEmail, emailConfirmationCode: test.emailConfirmationCode}, {token: context.tokens.userTest})
  mainTest.testRaw('confirmEmail', test, (data) => data.success && !data.errors)
  mainTest.testRaw('confirmEmail dbCheck', await dbGet(resultId), (data) => data.emailConfirmed === true)

  test = await netClient.testLocalMethod('assignPassword', {email: testEmail, password: 'password', confirmPassword: 'password'}, {token: context.tokens.userTest})
  mainTest.testRaw('assignPassword', test, (data) => data.success && !data.errors)
  mainTest.testRaw('assignPassword dbCheck', await dbGet(resultId), (data) => data.passwordAssigned === true)

  test = await netClient.testLocalMethod('login', {email: testEmail, password: 'password'}, {token: context.tokens.userTest})
  mainTest.testRaw('login', test, (data) => data.success && !data.errors)
  // mainTest.log('login', test)
  var loginToken = test.token

  mainTest.log(' dbCheck', await dbGet(resultId))

  test = await netClient.testLocalMethod('updatePersonalInfo', {id: resultId, publicName: 'NewPublicName', firstName: 'firstName'}, {token: loginToken})
  mainTest.testRaw('updatePersonalInfo', test, (data) => data.success && !data.errors)
  mainTest.testRaw('updatePersonalInfo dbCheck', await dbGet(resultId), (data) => data.publicName === 'NewPublicName' && data.firstName === 'firstName')

  test = await netClient.testLocalMethod('refreshToken', {}, {token: loginToken})
  mainTest.testRaw('refreshToken', test, (data) => data.success && !data.errors && data.token)
  // mainTest.log('refreshToken', test)
  // mainTest.testRaw('refreshToken dbCheck', await dbGet(resultId), (data) => typeof (data.token) === 'string')
  loginToken = test.token

  mainTest.sectionHead('PIC')

  var path = require('path')
  var fs = require('fs')
  // mainTest.consoleResume()
  fs.createReadStream(path.join(__dirname, '/test.png')).pipe(fs.createWriteStream(path.join(__dirname, '/test_send.png')))
  test = await netClient.testLocalMethod('addPic', {id: resultId, pic: {mimetype: 'image/png', path: path.join(__dirname, '/test_send.png')}}, {token: loginToken})
  mainTest.testRaw('addPic', test, (data) => data.success && !data.errors)
  mainTest.testRaw('addPic dbCheck', await dbGet(resultId), (data) => Object.keys(data.pics).length === 1)

  var picId = test.data.picId
  test = await netClient.testLocalMethod('getPic', {id: picId, size: 'full'}, {token: loginToken})
  mainTest.testRaw('getPic', test, (data) => typeof data === 'string')

  test = await netClient.testLocalMethod('deletePic', {id: picId}, {token: loginToken})
  mainTest.testRaw('deletePic', test, (data) => data.success && !data.error)
  mainTest.testRaw('deletePic dbCheck on user ', await dbGet(resultId), (data) => Object.keys(data.pics).length === 0)
  mainTest.testRaw('deletePic dbCheck on pic meta', await dbGet(resultId), (data) => Object.keys(data.pics).length === 0)

  test = await netClient.testLocalMethod('getPic', {id: picId, size: 'full'}, {token: loginToken})
  mainTest.testRaw('getPic deleted', test, (data) => !data.success && data.error)

  test = await netClient.testLocalMethod('updatePassword', {id: resultId, password: 'new_pass', confirmPassword: 'new_pass', oldPassword: 'password'}, {token: loginToken})
  mainTest.testRaw('updatePassword', test, (data) => data.success && !data.error)

  await dbRemove(resultId)
  await context.destroy()

  mainTest.sectionHead('GUEST')

  context = await setContext({
    data: {},
    users: { userTest: {} }
    // entities: [{'id': 'userTest', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'}]
  })
  test = await netClient.testLocalMethod('createGuest', { 'publicName': 'guest', 'email': 'createGuest@test.com' }, {token: context.tokens.userTest})
  mainTest.testRaw('createGuest', test, (data) => !data.errors && data.data.token && data.data.password)

  await context.destroy()

  mainTest.sectionHead('READ')

  context = await setContext({
    data: {},
    users: { userTest: {} },
    entities: [{'id': 'userTest', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'}]
    // testPuppets: { subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions() }
  })
  test = await netClient.testLocalMethod('readMulti', { ids: ['userTest'] }, {token: context.tokens.userTest})
  mainTest.testRaw('readMulti', test, (data) => !data.errors && data.results instanceof Array && data.results.length === 1)

  test = await netClient.testLocalMethod('readMulti', { ids: ['fakeid'] }, {token: context.tokens.userTest})
  mainTest.testRaw('readMulti checkError  User not exists', test, (data) => data.errors instanceof Array)

  await context.destroy()

  mainTest.sectionHead('UPDATE')

  context = await setContext({
    data: {},
    users: { userTest: {}, userAdminTest: {permissions: ['usersWrite']} },
    entities: [
      {'id': 'userTest', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'},
      {'id': 'userTest1', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'}
    ]
    // testPuppets: { subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions({'permissions': ['usersWrite', 'usersRead']}) }
  })

  test = await netClient.testLocalMethod('updateMulti', { items: [{id: 'userTest', tags: ['testUpdate']}] }, {token: context.tokens.userTest})
  mainTest.testRaw('updateMulti', test, (data) => !data.errors && data.results instanceof Array && data.results.length === 1)
  // dbCheck = await DB.get('usersViews', 'userTest')
  mainTest.testRaw('updateMulti dbCheck', await dbGet('userTest'), (data) => data.tags[0] === 'testUpdate')

  test = await netClient.testLocalMethod('updateMulti', { items: [{id: 'fake', tags: ['test']}] }, {token: context.tokens.userTest})
  mainTest.testRaw('updateMulti checkError  User not exists', test, (data) => data.errors instanceof Array)

  test = await netClient.testLocalMethod('updateMulti', { items: [{id: 'userTest1', tags: ['test']}] }, {token: context.tokens.userTest})
  mainTest.testRaw('updateMulti checkError  Cant update other users user', test, (data) => data.errors instanceof Array)

  // context.updatePuppets({subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions({'permissions': ['usersWrite', 'usersRead', 'usersWriteOtherUsers']})})
  test = await netClient.testLocalMethod('updateMulti', { items: [{id: 'userTest1', tags: ['test']}] }, {token: context.tokens.userAdminTest})
  mainTest.testRaw('updateMulti checkError  usersWrite can update other users user', test, (data) => !data.errors)

  await context.destroy()

  mainTest.sectionHead('DELETE')

  context = await setContext({
    data: {},
    users: { userTest: {}, userAdminTest: {permissions: ['usersWrite', 'usersReadAll', 'usersList']} },
    entities: [
      {'id': 'userTest', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'},
      {'id': 'userTest1', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'}
    ]
    // testPuppets: { subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions({'permissions': ['usersWrite', 'usersRead']}) }
  })

  test = await netClient.testLocalMethod('deleteMulti', { ids: ['userTest'] }, {token: context.tokens.userTest})
  // mainTest.log('test', test)
  mainTest.testRaw('deleteMulti', test, (data) => !data.errors && data.results instanceof Array && data.results.length === 1)
  mainTest.testRaw('deleteMulti dbCheck', await dbGet('userTest'), (data) => data.deleted === true)

  test = await netClient.testLocalMethod('readMulti', { ids: ['userTest1'] }, {token: context.tokens.userTest})
  mainTest.testRaw('readMulti checkError readMulti User deleted', test, (data) => data.errors instanceof Array)

  test = await netClient.testLocalMethod('readMulti', { ids: ['userTest'] }, {token: context.tokens.userTest})
  mainTest.testRaw('readMulti check User deleted but readable by owner', test, (data) => !data.errors)

  // context.updatePuppets({subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions({'permissions': ['usersWrite', 'usersRead', 'usersReadAll', 'usersWriteOtherUsers']})})
  test = await netClient.testLocalMethod('readMulti', { ids: ['userTest1'] }, {token: context.tokens.userAdminTest})
  mainTest.testRaw('readMulti check  User deleted but readable by admins', test, (data) => !data.errors)

  await context.destroy()

  // mainTest.sectionHead('CONFIRMATIONS')
  //
  // context = await setContext({
  //   data: {},
  //   users: { userTest: {}, userAdminTest: {} },
  //   entities: [
  //   ]
  //   // testPuppets: { subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions({'permissions': ['usersWrite', 'usersRead']}) }
  // })
  //
  // test = await netClient.testLocalMethod('createMulti', { items: [{ email: testEmail, tags: ['testTag'], toTags: ['testTag'], toRoles: ['subscriber'] }] }, {token: context.tokens.userTest})
  // mainTest.testRaw('createMulti with confirmation', test, (data) => !data.errors && data.results instanceof Array && data.results.length === 1)
  // mainTest.testRaw('createMulti with confirmation dbCheck', await dbGet(test.results[0].id), (data) => !data.confirmed)
  // var tempId = test.results[0].id
  // test = await netClient.testLocalMethod('confirmMulti', { ids: [test.results[0].id] }, {token: context.tokens.userAdminTest})
  // mainTest.testRaw('confirmMulti by admin user', test, (data) => !data.errors && data.results instanceof Array && data.results.length === 1)
  // mainTest.testRaw('confirmMulti dbCheck', await dbGet(test.results[0].id), (data) => data.confirmed === true)
  // await dbRemove(tempId)
  // await context.destroy()

  mainTest.sectionHead('TAGS')

  context = await setContext({
    data: {},
    users: { userTest: {}, userAdminTest: {permissions: ['usersWrite', 'usersReadAll', 'usersList']} },
    entities: [
      {'id': 'userTest', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'},
      {'id': 'userTest1', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'}
    ]
    // testPuppets: { subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions() }
  })

  test = await netClient.testLocalMethod('addTagsMulti', { items: [{id: 'userTest', tags: ['tag_by_subscriber', 'tag_by_subscriber2']}] }, {token: context.tokens.userTest})
  mainTest.testRaw('addTagsMulti by subcritpion owner', test, (data) => !data.errors && data.results instanceof Array && data.results.length === 1)
  mainTest.testRaw('addTagsMulti by subcritpion owner dbCheck', await dbGet('userTest'), (data) => data.tags.indexOf('tag_by_subscriber') > -1)

  test = await netClient.testLocalMethod('addTagsMulti', { items: [{id: 'userTest', tags: ['tag_by_admin', 'tag_by_admin2']}] }, {token: context.tokens.userAdminTest})
  mainTest.testRaw('addTagsMulti by admin', test, (data) => !data.errors && data.results instanceof Array && data.results.length === 1)
  mainTest.testRaw('addTagsMulti by admin  dbCheck', await dbGet('userTest'), (data) => data.tags.indexOf('tag_by_admin') > -1)

  await context.destroy()

  mainTest.sectionHead('LIST')

  context = await setContext({
    data: {},
    users: { userTest: {}, userAdminTest: {permissions: ['usersWrite', 'usersReadAll', 'usersList']} },
    entities: [
      {'id': 'userTest', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'},
      {'id': 'userTest1', 'email': 'test23644@test.com', 'emailConfirmationCode': '4c1d589d-44fe-439f-9b82-faa6c4d2cbd5', 'emailConfirmed': true, 'logins': 1, 'logouts': 0, 'meta': {'created': 1516090275074, 'updated': 1516090275232}, 'password': '$2a$10$84WUzaDciJuIz.b/S3kcPesWNZHqXlcHyOmerIUGqUpm3lAUdtqYW', 'passwordAssigned': true, 'permissions': [], 'personalInfo': {}, 'pics': {}, 'publicName': 'test23644'}
    ]
    // testPuppets: { subscriptions_getPermissions: getPuppetSubscriptionsGetPermissions() }
  })
  await new Promise((resolve) => setTimeout(resolve, 1000)) // DB INDEX UPDATE
  test = await netClient.testLocalMethod('list', { }, {token: context.tokens.userAdminTest})
  mainTest.testRaw('list', test, (data) => !data.errors && data.results instanceof Array && data.results.length >= 2)
  await context.destroy()

  await new Promise((resolve) => setTimeout(resolve, 1000))
  return mainTest.finish()
}
module.exports = startTest

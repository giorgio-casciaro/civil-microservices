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

  var microRandom = Math.floor(Math.random() * 100000)
  var mainTest = require('sint-bit-utils/utils/microTest')('test Microservice local methods and db connections', 0)
  var microTest = mainTest.test
  var finishTest = mainTest.finish

  var fs = require('fs')
  fs.createReadStream(path.join(__dirname, '/test.png')).pipe(fs.createWriteStream(path.join(__dirname, '/test_send.png')))

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
    name: `Dashboard name`,
    public: true,
    description: `Dashboard description`,
    tags: ['test', 'tag2', 'tag3'],
    maps: [{
      bbox: [14.0005, 15.0005, 16.0005, 17.0005]
    }]
  }
  var pic = {
    mimetype: 'image/png',
    path: path.join(__dirname, '/test_send.png')
  }

  // await netClient.rpc('testRpcNoResponse', {'test_data': 1}, meta)
  var createUser = async (userData) => {
    var rpcCall = async (to, method, data, meta) => {
      return await netClient.rpcCall({to, method, data, meta})
    }
    var user = await rpcCall('users', 'create', userData, {})
    microTest(user, { success: 'User created' }, 'User Create', FILTER_BY_KEYS)

    var readEmailConfirmationCode = await rpcCall('users', 'readEmailConfirmationCode', {id: user.id}, {})
    microTest(readEmailConfirmationCode, {emailConfirmationCode: 'string'}, 'User read Email Confirmation Code', TYPE_OF)

    var confirmEmailResp = await rpcCall('users', 'confirmEmail', { email: userData.email, emailConfirmationCode: readEmailConfirmationCode.emailConfirmationCode }, {})
    microTest(confirmEmailResp, { success: 'Email confirmed' }, 'User Email confirmed', FILTER_BY_KEYS)

    var assignPasswordResp = await rpcCall('users', 'assignPassword', {email: userData.email, password: userData.password, confirmPassword: userData.password}, {})
    microTest(assignPasswordResp, { success: 'string' }, 'User assignPassword', TYPE_OF)

    var login = await rpcCall('users', 'login', {email: userData.email, password: userData.password}, {})
    microTest(login, { success: 'string', token: 'string' }, 'User login', TYPE_OF)
    user.token = login.token
    return user
  }

  var userData = {
    publicName: `sir test_user ${microRandom}. junior`,
    email: `test${microRandom}@test${microRandom}.com`,
    password: `t$@es${microRandom}Tt$te1st_com`,
    newPassword: `new_t$@es${microRandom}Tt$te1st_com`,
    firstName: `t$@es${microRandom}Tt$te1st_com`,
    lastName: `t$@es${microRandom}Tt$te1st_com`
  }

  var userData2 = {
    publicName: `sir test_user 2 ${microRandom}. junior`,
    email: `test2${microRandom}@test${microRandom}.com`,
    password: `t$@es2${microRandom}Tt$te1st_com`,
    newPassword: `new_2t$@es${microRandom}Tt$te1st_com`,
    firstName: `t$@2es${microRandom}Tt$te1st_com`,
    lastName: `t$@2es${microRandom}Tt$te1st_com`
  }

  var user1 = await createUser(userData)
  // var user2 = await createUser(userData2)
  var create = await netClient.testLocalMethod('create', fields, {token: user1.token})
  microTest(create, { success: 'Dashboard created' }, 'Dashboard Create', FILTER_BY_KEYS)

  var read = await netClient.testLocalMethod('read', { id: create.id }, {token: user1.token})
  microTest(read, {name: fields.name}, 'Dashboard Read', FILTER_BY_KEYS)

  var update = await netClient.testLocalMethod('update', { id: create.id, name: fields.name, description: fields.description2, tags: fields.tags }, {token: user1.token})
  microTest(update, { success: 'Dashboard updated' }, 'Dashboard update', FILTER_BY_KEYS)

  var read2 = await netClient.testLocalMethod('read', { id: create.id }, {token: user1.token})
  microTest(read2, {description: fields.description2}, 'Dashboard Read Updated description', FILTER_BY_KEYS)

  var updatePic = await netClient.testLocalMethod('updatePic', {id: create.id, pic: pic}, {token: user1.token})
  microTest(updatePic, { success: 'string' }, 'updatePic', TYPE_OF)

  var getPic = await netClient.testLocalMethod('getPic', {id: create.id}, {token: user1.token})
  microTest(typeof getPic, 'string', 'getPic')

  var role = {
    dashId: create.id,
    slug: `role${microRandom}`,
    name: `role 2${microRandom}Tt$t e1st_com`,
    description: `role $@es${microRandom}Tt$te1st_com`,
    permissions: [
      [10, 'dashboard.create', 1]
    ]
  }

  var getRole = await netClient.testLocalMethod('getRole', {id: create.id}, {token: user1.token})
  microTest(typeof getRole, 'string', 'getRole')

  var setRole = await netClient.testLocalMethod('setRole', {id: create.id}, {token: user1.token})
  microTest(typeof setRole, 'string', 'setRole')

  // var subscribe = await netClient.testLocalMethod('subscribe', {dashId: create.id, userId: user1.id}, {token: user1.token})
  // microTest(subscribe, { success: 'subscribed' }, 'subscribed', FILTER_BY_KEYS)
  //
  // var unsubscribe = await netClient.testLocalMethod('unsubscribe', {dashId: create.id, userId: user1.id}, {token: user1.token})
  // microTest(unsubscribe, { success: 'unsubscribed' }, 'unsubscribed', FILTER_BY_KEYS)

  var removeResp = await netClient.testLocalMethod('remove', { id: create.id }, {token: user1.token})
  microTest(removeResp, { success: 'Dashboard removed' }, 'Dashboard remove', FILTER_BY_KEYS)

  var wrongReadResp = await netClient.testLocalMethod('read', { id: create.id }, {token: user1.token})
  microTest(wrongReadResp, { error: 'string' }, 'Wrong Read (dash removed)', TYPE_OF)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  return finishTest()
}
module.exports = startTest

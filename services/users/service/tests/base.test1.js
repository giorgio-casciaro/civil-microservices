process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var startTest = async function (netClient) {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  var rpcCall = (to, method, data, meta) => netClient.rpcCall({to, method, data, meta})
  var microRandom = Math.floor(Math.random() * 100000)
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
  // const COUNT = (actual, expected) => actual.length

  var fields = {
    name: `User name`,
    public: true,
    description: `User description`,
    description2: `User description 2`,
    tags: ['test', 'tag2', 'tag3'],
    maps: [{
      centerLat: 14.0005,
      centerLng: 14.0005,
      zoom: 5
    }],
    options: {
      guestRead: 'allow',
      guestSubscribe: 'allow',
      guestWrite: 'allow',
      subscriberWrite: 'allow'
    }
  }

  // await netClient.rpc('testRpcNoResponse', {'test_data': 1}, meta)
  var createUser = async (userData) => {
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
  var user2 = await createUser(userData2)

  // CREATE DASH
  var create = await rpcCall('users', 'create', {
    name: `User name`,
    public: true,
    description: `User description`,
    description2: `User description 2`,
    tags: ['test', 'tag2', 'tag3'],
    maps: [{
      centerLat: 14.0005,
      centerLng: 14.0005,
      zoom: 5
    }],
    options: {
      guestRead: 'allow',
      guestSubscribe: 'allow',
      guestWrite: 'allow',
      subscriberWrite: 'allow'
    }
  }, {token: user1.token})
  microTest(create, { success: 'User created' }, 'User Create', FILTER_BY_KEYS, 0, fields)

  // SUBSCRIPTIONS
  var wrongUser = {
    dashId: create.id,
    roleId: 'admin',
    userId: user2.id,
    notifications: ['email', 'sms', 'fb']
  }

  var user = {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user2.id,
    tags: ['testTag'],
    notifications: ['email', 'sms', 'fb']
  }

  // WRONG SUB, user2 cant create not public roles
  var createWrongUser = await netClient.testLocalMethod('create', wrongUser, {token: user2.token})
  microTest(createWrongUser, { error: 'string' }, 'createWrongUser', TYPE_OF)

  var usersCreate = await netClient.testLocalMethod('create', user, {token: user2.token})
  microTest(usersCreate, { success: 'User created' }, 'usersCreate', FILTER_BY_KEYS)

  var usersRead = await netClient.testLocalMethod('read', { id: usersCreate.id }, {token: user2.token})
  microTest(usersRead, {name: user.name, dashId: create.id}, 'usersRead', FILTER_BY_KEYS)
  microTest(usersRead, {notifications: 'object'}, 'usersRead notifications', TYPE_OF)

  var usersUpdate = await netClient.testLocalMethod('update', { id: usersCreate.id, roleId: 'admin' }, {token: user1.token})
  microTest(usersUpdate, { success: 'User updated' }, 'usersUpdate', FILTER_BY_KEYS, 0, { id: usersCreate.id, roleId: 'admin' })

  var usersRead2 = await netClient.testLocalMethod('read', { id: usersCreate.id }, {token: user2.token})
  microTest(usersRead2, {roleId: 'admin'}, 'usersRead2', FILTER_BY_KEYS)

  var usersUpdate2 = await netClient.testLocalMethod('update', { id: usersCreate.id, roleId: 'subscriber' }, {token: user2.token})
  microTest(usersUpdate2, { success: 'User updated' }, 'usersUpdate', FILTER_BY_KEYS, 0, { id: usersCreate.id, roleId: 'subscriber' })

  var usersRemove = await netClient.testLocalMethod('remove', { id: usersCreate.id }, {token: user2.token})
  microTest(usersRemove, { success: 'User removed' }, 'User remove', FILTER_BY_KEYS)

  var wrongusersRead = await netClient.testLocalMethod('read', { id: usersCreate.id }, {token: user2.token})
  microTest(wrongusersRead, { error: 'string' }, 'Wrong usersRead (User removed)', TYPE_OF)

  // SUBSCRIPTIONS QUERY
  const uuid = require('uuid/v4')

  var rpcusersCreateN = (n) => netClient.testLocalMethod('create', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: uuid(),
    tags: ['testTag', 'testTag2'],
    notifications: ['email', 'sms', 'fb']
  }, {token: user1.token})

  for (var i = 0; i < 50; i++) {
    var usersCreateN = await rpcusersCreateN(i)
    microTest(usersCreateN, { success: 'User created' }, 'usersCreateN' + i, FILTER_BY_KEYS)
  }
//   var usersListLast = await netClient.testLocalMethod('usersListLast', { dashId: create.id, from: 0, to: 10 }, {token: user1.token})
  // console.log('usersListLast', usersListLast)
  var usersListLast = await netClient.testLocalMethod('listLast', { dashId: create.id, from: 0, to: 10 }, {token: user1.token})
  microTest(usersListLast[0] || [], {dashId: create.id}, 'usersListLast', FILTER_BY_KEYS)
  microTest(usersListLast.length, 10, 'usersListLast Number')
  mainTest.consoleResume()
  console.log('usersListLast', usersListLast)
  mainTest.consoleMute()
  // return finishTest()
  var usersGetExtendedByUserId = await netClient.testLocalMethod('getExtendedByUserId', { }, {token: user2.token})
  microTest(usersGetExtendedByUserId, 'array', 'usersGetExtendedByUserId', TYPE_OF, 0)
  // mainTest.consoleResume()
  var usersListByDashIdTagsRoles_admin = await netClient.testLocalMethod('listByDashIdTagsRoles', { dashId: create.id, roles: ['admin'] }, {token: user1.token})
  // console.log('usersListByDashIdTagsRoles_admin', usersListByDashIdTagsRoles_admin)
  microTest(usersListByDashIdTagsRoles_admin, 'array', 'listByDashIdTagsRoles_admin', TYPE_OF, 0)

  microTest(usersListByDashIdTagsRoles_admin[0], {roleId: 'admin'}, 'listByDashIdTagsRoles_admin', FILTER_BY_KEYS)

  var usersListByDashIdTagsRoles_testTag = await netClient.testLocalMethod('listByDashIdTagsRoles', { dashId: create.id, tags: ['testTag'] }, {token: user1.token})
  microTest(usersListByDashIdTagsRoles_testTag, 'array', 'usersListByDashIdTagsRoles', TYPE_OF, 0)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  return finishTest()
}
module.exports = startTest

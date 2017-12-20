process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})
var path = require('path')

var startTest = async function (netClient) {
  var microRandom = Math.floor(Math.random() * 100000)
  var mainTest = require('sint-bit-utils/utils/microTest')('test Microservice local methods and db connections', 0)
  var microTest = mainTest.test
  var finishTest = mainTest.finish

  var fs = require('fs')
  fs.createReadStream(path.join(__dirname, '/test.png')).pipe(fs.createWriteStream(path.join(__dirname, '/test_send.png')))
  fs.createReadStream(path.join(__dirname, '/test.png')).pipe(fs.createWriteStream(path.join(__dirname, '/test_send2.png')))

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

  var fields = {
    name: `Dashboard name`,
    public: true,
    description: `Dashboard description`,
    description2: `Dashboard description 2`,
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
  var user2 = await createUser(userData2)

  var startDetDashboardsMeta = await netClient.testLocalMethod('getDashboardsMeta', { }, {token: user1.token})
  var totalDashboards = startDetDashboardsMeta.count

  // mainTest.consoleResume()
  var create = await netClient.testLocalMethod('create', fields, {token: user1.token})
  microTest(create, { success: 'Dashboard created' }, 'Dashboard Create', FILTER_BY_KEYS, 0, fields)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  var read = await netClient.testLocalMethod('read', { id: create.id }, {token: user1.token})
  microTest(read, {name: fields.name}, 'Dashboard Read', FILTER_BY_KEYS)
  var update = await netClient.testLocalMethod('update', { id: create.id, name: fields.name, description: fields.description2, tags: fields.tags }, {token: user1.token})
  microTest(update, { success: 'Dashboard updated' }, 'Dashboard update', FILTER_BY_KEYS)

  var read2 = await netClient.testLocalMethod('read', { id: create.id }, {token: user1.token})
  microTest(read2, {description: fields.description2}, 'Dashboard Read Updated description', FILTER_BY_KEYS)

  var updatePic = await netClient.testLocalMethod('updatePic', {id: create.id, pic: pic}, {token: user1.token})
  microTest(updatePic, { success: 'string' }, 'updatePic', TYPE_OF, 0)

  var getPic = await netClient.testLocalMethod('getPic', {id: updatePic.id}, {token: user1.token})
  microTest(getPic, 'string', 'getPic', TYPE_OF, 0, {id: updatePic.id})

  // DASHS QUERY
  var rpcCreateDashN = (n) => netClient.testLocalMethod('create', {
    name: `Dashboard name ` + n,
    public: true,
    description: `Dashboard description`,
    tags: ['test', 'tag2', 'tag3'],
    maps: [{
      centerLat: 14.0005,
      centerLng: 14.0005,
      zoom: 5
    }]
  }, {token: user2.token})

  for (var i = 0; i < 20; i++) {
    // mainTest.consoleResume()
    var createDashN = await rpcCreateDashN(i)
    microTest(createDashN, { success: 'Dashboard created' }, 'Dashboard Create', FILTER_BY_KEYS)
  }

  var listLastDashboards = await netClient.testLocalMethod('listLastDashboards', { from: 10, to: 20 }, {token: user2.token})
  microTest(listLastDashboards[0], {name: `Dashboard name ` + 9}, 'listLastDashboards', FILTER_BY_KEYS)
  microTest(listLastDashboards.length, 10, 'listLastDashboards Number')

  // ROLES
  // var role = {
  //   dashId: create.id,
  //   slug: `role${microRandom}`,
  //   public: 1,
  //   name: `role 2${microRandom}Tt$t e1st_com`,
  //   description: `role $@es${microRandom}Tt$te1st_com`,
  //   description2: `role 2 $@es${microRandom}Tt$te1st_com`,
  //   permissions: ['readDashboard', 'postsReads', 'writePosts']
  // }
  //
  // var createRole = await netClient.testLocalMethod('createRole', role, {token: user1.token})
  // microTest(createRole, { success: 'Role created' }, 'createRole', FILTER_BY_KEYS, 0, role)
  //
  // var readRole = await netClient.testLocalMethod('readRole', { id: createRole.id }, {token: user1.token})
  // microTest(readRole, {name: role.name}, 'readRole', FILTER_BY_KEYS)
  //
  // var updateRole = await netClient.testLocalMethod('updateRole', { id: createRole.id, description: role.description2 }, {token: user1.token})
  // microTest(updateRole, { success: 'Role updated' }, 'updateRole', FILTER_BY_KEYS)
  //
  // var readRole2 = await netClient.testLocalMethod('readRole', { id: createRole.id }, {token: user1.token})
  // microTest(readRole2, {description: role.description2}, 'readRole2', FILTER_BY_KEYS)
  //
  // var roleNotPublic = {
  //   dashId: create.id,
  //   slug: `roleNotPublic${microRandom}`,
  //   public: 0,
  //   name: `roleNotPublic 2${microRandom}Tt$t e1st_com`,
  //   description: `roleNotPublic $@es${microRandom}Tt$te1st_com`,
  //   description2: `roleNotPublic 2 $@es${microRandom}Tt$te1st_com`,
  //   permissions: ['readDashboard', 'write', 'writePost', 'writeSubscriptions']
  // }
  //
  // var createNotPublicRole = await netClient.testLocalMethod('createRole', roleNotPublic, {token: user1.token})
  // microTest(createNotPublicRole, { success: 'Role created' }, 'createNotPublicRole', FILTER_BY_KEYS)
  //
  // var readNotPublicRole = await netClient.testLocalMethod('readRole', { id: createNotPublicRole.id }, {token: user1.token})
  // microTest(readNotPublicRole, {name: roleNotPublic.name}, 'readRole', FILTER_BY_KEYS, 0)

  // SUBSCRIPTIONS
  var wrongSubscription = {
    dashId: create.id,
    roleId: 'admin',
    userId: user2.id,
    notifications: ['email', 'sms', 'fb']
  }

  var subscription = {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user2.id,
    tags: ['testTag'],
    notifications: ['email', 'sms', 'fb']
  }

  // WRONG SUB, user2 cant create not public roles
  var createWrongSubscription = await netClient.testLocalMethod('subscriptionsCreate', wrongSubscription, {token: user2.token})
  microTest(createWrongSubscription, { error: 'string' }, 'createWrongSubscription', TYPE_OF)

  var subscriptionsCreate = await netClient.testLocalMethod('subscriptionsCreate', subscription, {token: user2.token})
  microTest(subscriptionsCreate, { success: 'Subscription created' }, 'subscriptionsCreate', FILTER_BY_KEYS)

  var subscriptionsRead = await netClient.testLocalMethod('subscriptionsRead', { id: subscriptionsCreate.id }, {token: user2.token})
  microTest(subscriptionsRead, {name: subscription.name, dashId: create.id}, 'subscriptionsRead', FILTER_BY_KEYS)
  microTest(subscriptionsRead, {notifications: 'object'}, 'subscriptionsRead notifications', TYPE_OF)

  var subscriptionsUpdate = await netClient.testLocalMethod('subscriptionsUpdate', { id: subscriptionsCreate.id, roleId: 'admin'}, {token: user1.token})
  microTest(subscriptionsUpdate, { success: 'Subscription updated' }, 'subscriptionsUpdate', FILTER_BY_KEYS, 0, { id: subscriptionsCreate.id, roleId: 'admin'})

  var subscriptionsRead2 = await netClient.testLocalMethod('subscriptionsRead', { id: subscriptionsCreate.id }, {token: user2.token})
  microTest(subscriptionsRead2, {roleId: 'admin'}, 'subscriptionsRead2', FILTER_BY_KEYS)

  var subscriptionsUpdate2 = await netClient.testLocalMethod('subscriptionsUpdate', { id: subscriptionsCreate.id, roleId: 'subscriber'}, {token: user2.token})
  microTest(subscriptionsUpdate2, { success: 'Subscription updated' }, 'subscriptionsUpdate', FILTER_BY_KEYS, 0, { id: subscriptionsCreate.id, roleId: 'subscriber'})

  var subscriptionsRemove = await netClient.testLocalMethod('subscriptionsRemove', { id: subscriptionsCreate.id }, {token: user2.token})
  microTest(subscriptionsRemove, { success: 'Subscription removed' }, 'Subscription remove', FILTER_BY_KEYS)

  var wrongsubscriptionsRead = await netClient.testLocalMethod('subscriptionsRead', { id: subscriptionsCreate.id }, {token: user2.token})
  microTest(wrongsubscriptionsRead, { error: 'string' }, 'Wrong subscriptionsRead (Subscription removed)', TYPE_OF)

  // SUBSCRIPTIONS QUERY
  const uuid = require('uuid/v4')

  var rpcsubscriptionsCreateN = (n) => netClient.testLocalMethod('subscriptionsCreate', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: uuid(),
    tags: ['testTag', 'testTag2'],
    notifications: ['email', 'sms', 'fb']
  }, {token: user1.token})

  for (i = 0; i < 50; i++) {
    var subscriptionsCreateN = await rpcsubscriptionsCreateN(i)
    microTest(subscriptionsCreateN, { success: 'Subscription created' }, 'subscriptionsCreateN' + i, FILTER_BY_KEYS)
  }
//   var subscriptionsListLast = await netClient.testLocalMethod('subscriptionsListLast', { dashId: create.id, from: 0, to: 10 }, {token: user1.token})
  // console.log('subscriptionsListLast', subscriptionsListLast)
  var subscriptionsListLast = await netClient.testLocalMethod('subscriptionsListLast', { dashId: create.id, from: 0, to: 10 }, {token: user1.token})
  microTest(subscriptionsListLast[0] || [], {dashId: create.id}, 'subscriptionsListLast', FILTER_BY_KEYS)
  microTest(subscriptionsListLast.length, 10, 'subscriptionsListLast Number')
  mainTest.consoleResume()
  console.log('subscriptionsListLast', subscriptionsListLast)
  mainTest.consoleMute()
  // return finishTest()
  var subscriptionsGetExtendedByUserId = await netClient.testLocalMethod('subscriptionsGetExtendedByUserId', { }, {token: user2.token})
  microTest(subscriptionsGetExtendedByUserId, 'array', 'subscriptionsGetExtendedByUserId', TYPE_OF, 0)
  // mainTest.consoleResume()
  var subscriptionsListByDashIdTagsRoles_admin = await netClient.testLocalMethod('subscriptionsListByDashIdTagsRoles', { dashId: create.id, roles: ['admin'] }, {token: user1.token})
  // console.log('subscriptionsListByDashIdTagsRoles_admin', subscriptionsListByDashIdTagsRoles_admin)
  microTest(subscriptionsListByDashIdTagsRoles_admin, 'array', 'subscriptionsListByDashIdTagsRoles_admin', TYPE_OF, 0)

  microTest(subscriptionsListByDashIdTagsRoles_admin[0], {roleId: 'admin'}, 'subscriptionsListByDashIdTagsRoles_admin', FILTER_BY_KEYS)

  var subscriptionsListByDashIdTagsRoles_testTag = await netClient.testLocalMethod('subscriptionsListByDashIdTagsRoles', { dashId: create.id, tags: ['testTag'] }, {token: user1.token})
  microTest(subscriptionsListByDashIdTagsRoles_testTag, 'array', 'subscriptionsListByDashIdTagsRoles', TYPE_OF, 0)
  // microTest(subscriptionsListByDashIdTagsRoles_testTag[0].tags, {dashId: create.id}, 'subscriptionsListByDashIdTagsRoles_testTag', FILTER_BY_KEYS)
  // mainTest.consoleResume()
  // console.log('subscriptionsListByDashIdTagsRoles_testTag', subscriptionsListByDashIdTagsRoles_testTag)
  // mainTest.consoleMute()
  // POSTS
  var user_posts = await createUser({
    publicName: `sir test_user 4 ${microRandom}. junior`,
    email: `test4${microRandom}@test${microRandom}.com`,
    password: `t$@es4${microRandom}Tt$te1st_com`,
    newPassword: `new_4t$@es${microRandom}Tt$te1st_com`,
    firstName: `t$@4es${microRandom}Tt$te1st_com`,
    lastName: `t$@4es${microRandom}Tt$te1st_com`
  })
  var post = {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    body2: 'test post2',
    tags: ['test', 'tag2', 'tag3'],
    notifications: ['email', 'sms', 'fb']
  }

  var postsCreate = await netClient.testLocalMethod('postsCreate', post, {token: user_posts.token})
  microTest(postsCreate, { success: 'Dashboard Posts - created' }, 'postsCreate', FILTER_BY_KEYS)

  var postPic = {
    mimetype: 'image/png',
    path: path.join(__dirname, '/test_send2.png')
  }

  var postsAddPic = await netClient.testLocalMethod('postsAddPic', { id: postsCreate.id, pic: postPic }, {token: user_posts.token})
  microTest(postsAddPic, { success: 'Dashboard Posts - pic updated' }, 'postsAddPic', FILTER_BY_KEYS)

  var postsRead = await netClient.testLocalMethod('postsRead', { id: postsCreate.id }, {token: user_posts.token})
  microTest(postsRead, {body: post.body, readedByUser: 1}, 'postsRead', FILTER_BY_KEYS)
  microTest(postsRead, {notifications: 'object'}, 'postsRead notifications', TYPE_OF)

  var postsGetPic = await netClient.testLocalMethod('postsGetPic', {id: postsRead.pics[0]}, {token: user_posts.token})
  microTest(typeof postsGetPic, 'string', 'postsGetPic')

  var postsRemovePic = await netClient.testLocalMethod('postsRemovePic', { id: postsCreate.id, picId: postsRead.pics[0] }, {token: user_posts.token})
  microTest(postsRemovePic, { success: 'Dashboard Posts - pic removed' }, 'postsRemovePic', FILTER_BY_KEYS)

  var postsUpdate = await netClient.testLocalMethod('postsUpdate', { id: postsCreate.id, body: post.body2 }, {token: user_posts.token})
  microTest(postsUpdate, { success: 'Dashboard Posts - updated' }, 'postsUpdate', FILTER_BY_KEYS)

  var postsRead2 = await netClient.testLocalMethod('postsRead', { id: postsCreate.id }, {token: user_posts.token})
  microTest(postsRead2, {body: post.body2, readedByUser: 2}, 'postsRead2', FILTER_BY_KEYS)

  var postsRemove = await netClient.testLocalMethod('postsRemove', { id: postsCreate.id }, {token: user_posts.token})
  microTest(postsRemove, { success: 'Dashboard Posts - removed' }, 'Post remove', FILTER_BY_KEYS)

  var wrongpostsRead = await netClient.testLocalMethod('postsRead', { id: postsCreate.id }, {token: user2.token})
  microTest(wrongpostsRead, { error: 'string' }, 'Wrong postsRead (Post removed)', TYPE_OF)

  // POSTS QUERY
  var rpcpostsCreateN = (n) => netClient.testLocalMethod('postsCreate', {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test ' + n,
    tags: ['test', 'tag2', 'tag3']
  }, {token: user_posts.token})

  for (i = 0; i < 20; i++) {
    var postsCreateN = await rpcpostsCreateN(i)
    microTest(postsCreateN, { success: 'Dashboard Posts - created' }, 'postsCreateN' + i, FILTER_BY_KEYS)
  }
    // finishTest()
  var postsListLast = await netClient.testLocalMethod('postsListLast', { dashId: create.id, from: 10, to: 20 }, {token: user_posts.token})
  // mainTest.consoleResume()
  // console.log('postsListLast', postsListLast)
  // mainTest.consoleMute()

  // microTest(postsListLast, 'object', 'postsListLast', TYPE_OF, 2, { dashId: create.id, from: 10, to: 20 })
  microTest(postsListLast[0], {userId: user_posts.id}, 'postsListLast', FILTER_BY_KEYS)
  microTest(postsListLast.length, 10, 'postsListLast Number')

  var removeLastPost = await netClient.testLocalMethod('postsRemove', { id: postsListLast[0].id }, {token: user_posts.token})
  microTest(removeLastPost, { success: 'Dashboard Posts - removed' }, 'Last Post remove', FILTER_BY_KEYS)

  var postsListLastAfterRemove = await netClient.testLocalMethod('postsListLast', { dashId: post.dashId, from: 10, to: 20 }, {token: user2.token})
  microTest(postsListLastAfterRemove.length, 9, 'postsListLast Number')

  // GUEST READ
  var createGuestpostsRead = await netClient.testLocalMethod('postsCreate', post, {token: user1.token})

  // DASH OPTIONS DENY
  var user3 = await createUser({
    publicName: `sir test_user 3 ${microRandom}. junior`,
    email: `test3${microRandom}@test${microRandom}.com`,
    password: `t$@es3${microRandom}Tt$te1st_com`,
    newPassword: `new_3t$@es${microRandom}Tt$te1st_com`,
    firstName: `t$@3es${microRandom}Tt$te1st_com`,
    lastName: `t$@3es${microRandom}Tt$te1st_com`
  })

  await netClient.testLocalMethod('update',
    { id: create.id,
      options: {
        guestRead: 'deny',
        guestSubscribe: 'deny',
        guestWrite: 'deny',
        subscriberWrite: 'deny'
      }
    }, {token: user1.token})

  var denyGuestReadDash = await netClient.testLocalMethod('read', { id: create.id }, {})
  microTest(denyGuestReadDash, { error: 'string' }, 'Deny Guest Dashboard Read', TYPE_OF)

  var denyGuestpostsRead = await netClient.testLocalMethod('postsRead', { id: createGuestpostsRead.id }, {})
  microTest(denyGuestpostsRead, { error: 'string' }, 'Deny Guest postsRead', TYPE_OF)

  var denyGuestSubscribe = await netClient.testLocalMethod('subscriptionsCreate', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user3.id
  }, {})
  microTest(denyGuestSubscribe, { error: 'string' }, 'Deny Guest Subscribe', TYPE_OF)

  var denyGuestpostsCreate = await netClient.testLocalMethod('postsCreate', {
    dashId: create.id,
    // userId: user3.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {})
  microTest(denyGuestpostsCreate, { error: 'string' }, 'Deny Guest Create Post', TYPE_OF)

  var denySubscriberpostsCreate = await netClient.testLocalMethod('postsCreate', {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {token: user2.token})
  microTest(denySubscriberpostsCreate, { error: 'string' }, 'Deny Subscriber Create Post', TYPE_OF)

  // DASH OPTIONS CONFIRM
  await netClient.testLocalMethod('update',
    { id: create.id,
      options: {
        guestRead: 'allow',
        guestSubscribe: 'confirm',
        guestWrite: 'confirm',
        subscriberWrite: 'confirm'
      }
    }, {token: user1.token})

  var confirmGuestSubscribe = await netClient.testLocalMethod('subscriptionsCreate', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user3.id
  }, {token: user3.token})
  microTest(confirmGuestSubscribe, { success: 'Subscription created' }, 'confirmGuestSubscribe', FILTER_BY_KEYS)

  var confirmGuestpostsCreate = await netClient.testLocalMethod('postsCreate', {
    dashId: create.id,
    // userId: user3.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {})
  microTest(confirmGuestpostsCreate, { success: 'Dashboard Posts - created' }, 'confirmGuestpostsCreate', FILTER_BY_KEYS)

  var confirmSubscriberpostsCreate = await netClient.testLocalMethod('postsCreate', {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {token: user2.token})
  microTest(confirmSubscriberpostsCreate, { success: 'Dashboard Posts - created' }, 'confirmSubscriberpostsCreate', FILTER_BY_KEYS)

  // DASH OPTIONS ALLOW
  var user4 = await createUser({
    publicName: `sir test_user 4 4${microRandom}. junior`,
    email: `test44${microRandom}@test${microRandom}.com`,
    password: `t$@es44${microRandom}Tt$te1st_com`,
    newPassword: `new_4t$@es${microRandom}Tt$te1st_com`,
    firstName: `t$@4es${microRandom}Tt$te1st_com`,
    lastName: `t$@4es${microRandom}Tt$te1st_com`
  })
  await netClient.testLocalMethod('update',
    { id: create.id,
      options: {
        guestRead: 'allow',
        guestSubscribe: 'allow',
        guestWrite: 'allow',
        subscriberWrite: 'allow'
      }
    }, {token: user1.token})

  var allowGuestReadDash = await netClient.testLocalMethod('read', { id: create.id }, {})
  microTest(allowGuestReadDash, {name: fields.name}, 'Guest Dashboard Read', FILTER_BY_KEYS)

  var allowGuestpostsRead = await netClient.testLocalMethod('postsRead', { id: createGuestpostsRead.id }, {})
  microTest(allowGuestpostsRead, {body: post.body}, 'Guest postsRead', FILTER_BY_KEYS)

  var allowGuestSubscribe = await netClient.testLocalMethod('subscriptionsCreate', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user4.id
  }, {token: user4.token})
  microTest(allowGuestSubscribe, { success: 'Subscription created' }, 'allowGuestSubscribe', FILTER_BY_KEYS)

  var allowGuestpostsCreate = await netClient.testLocalMethod('postsCreate', {
    dashId: create.id,
    // userId: user3.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {})
  microTest(allowGuestpostsCreate, { success: 'Dashboard Posts - created' }, 'allowGuestpostsCreate', FILTER_BY_KEYS)

  var allowSubscriberpostsCreate = await netClient.testLocalMethod('postsCreate', {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {token: user2.token})
  microTest(allowSubscriberpostsCreate, { success: 'Dashboard Posts - created' }, 'allowGuestpostsCreate', FILTER_BY_KEYS)

  // var updateOptionsGuestSubscribeDeny = await netClient.testLocalMethod('update',
  //   { id: create.id,
  //     options: {
  //       guestRead: 'deny',
  //       guestSubscribe: 'deny',
  //       guestWrite: 'confirm',
  //       subscriberWrite: 'confirm'
  //     }
  //   }, {token: user1.token})
  // microTest(updateOptionsGuestReadDeny, { success: 'Dashboard updated' }, 'Dashboard update', FILTER_BY_KEYS)

  // // REMOVE ROLES
  // var removeRole = await netClient.testLocalMethod('removeRole', { id: createRole.id }, {token: user1.token})
  // microTest(removeRole, { success: 'Role removed' }, 'Role remove', FILTER_BY_KEYS, 0, { id: createRole.id })
  //
  // var wrongReadRole = await netClient.testLocalMethod('readRole', { id: createRole.id }, {token: user1.token})
  // microTest(wrongReadRole, { error: 'string' }, 'Wrong readRole (role removed)', TYPE_OF)

  var removeResp = await netClient.testLocalMethod('remove', { id: create.id }, {token: user1.token})
  microTest(removeResp, { success: 'Dashboard removed' }, 'Dashboard remove', FILTER_BY_KEYS)

  var wrongReadResp = await netClient.testLocalMethod('read', { id: create.id }, {token: user1.token})
  microTest(wrongReadResp, { error: 'string' }, 'Wrong Read (dash removed)', TYPE_OF)

  var getDashboardsMeta = await netClient.testLocalMethod('getDashboardsMeta', { }, {token: user1.token})
  microTest(getDashboardsMeta, {count: totalDashboards + 21}, 'getDashboardsMeta', FILTER_BY_KEYS)

  var postsExportCanBeRead = await netClient.testLocalMethod('postsExportCanBeRead', { }, {token: user1.token})
  // mainTest.consoleResume()
  // console.log('postsExportCanBeRead', postsExportCanBeRead)
  // mainTest.consoleMute()
  microTest(postsExportCanBeRead, {func: 'string'}, 'postsExportCanBeRead', TYPE_OF)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  return finishTest()
}
module.exports = startTest

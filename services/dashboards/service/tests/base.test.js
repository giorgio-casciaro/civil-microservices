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

  var create = await netClient.testLocalMethod('create', fields, {token: user1.token})
  microTest(create, { success: 'Dashboard created' }, 'Dashboard Create', FILTER_BY_KEYS, 0, fields)

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
    var createDashN = await rpcCreateDashN(i)
    microTest(createDashN, { success: 'Dashboard created' }, 'Dashboard Create', FILTER_BY_KEYS)
  }

  var queryLastDashboards = await netClient.testLocalMethod('queryLastDashboards', { from: 10, to: 20 }, {token: user2.token})
  microTest(queryLastDashboards[0], {name: `Dashboard name ` + 9}, 'queryLastDashboards', FILTER_BY_KEYS)
  microTest(queryLastDashboards.length, 10, 'queryLastDashboards Number')

  // ROLES
  // var role = {
  //   dashId: create.id,
  //   slug: `role${microRandom}`,
  //   public: 1,
  //   name: `role 2${microRandom}Tt$t e1st_com`,
  //   description: `role $@es${microRandom}Tt$te1st_com`,
  //   description2: `role 2 $@es${microRandom}Tt$te1st_com`,
  //   permissions: ['readDashboard', 'readPosts', 'writePosts']
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
    userId: user2.id
  }

  var subscription = {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user2.id
  }

  // WRONG SUB, user2 cant create not public roles
  var createWrongSubscription = await netClient.testLocalMethod('createSubscription', wrongSubscription, {token: user2.token})
  microTest(createWrongSubscription, { error: 'string' }, 'createWrongSubscription', TYPE_OF)

  var createSubscription = await netClient.testLocalMethod('createSubscription', subscription, {token: user2.token})
  microTest(createSubscription, { success: 'Subscription created' }, 'createSubscription', FILTER_BY_KEYS)

  var readSubscription = await netClient.testLocalMethod('readSubscription', { id: createSubscription.id }, {token: user2.token})
  microTest(readSubscription, {name: subscription.name}, 'readSubscription', FILTER_BY_KEYS)

  var updateSubscription = await netClient.testLocalMethod('updateSubscription', { id: createSubscription.id, roleId: 'admin'}, {token: user1.token})
  microTest(updateSubscription, { success: 'Subscription updated' }, 'updateSubscription', FILTER_BY_KEYS, 0, { id: createSubscription.id, roleId: 'admin'})

  var readSubscription2 = await netClient.testLocalMethod('readSubscription', { id: createSubscription.id }, {token: user2.token})
  microTest(readSubscription2, {roleId: 'admin'}, 'readSubscription2', FILTER_BY_KEYS)

  var updateSubscription2 = await netClient.testLocalMethod('updateSubscription', { id: createSubscription.id, roleId: 'subscriber'}, {token: user2.token})
  microTest(updateSubscription2, { success: 'Subscription updated' }, 'updateSubscription', FILTER_BY_KEYS, 0, { id: createSubscription.id, roleId: 'subscriber'})

  var removeSubscription = await netClient.testLocalMethod('removeSubscription', { id: createSubscription.id }, {token: user2.token})
  microTest(removeSubscription, { success: 'Subscription removed' }, 'Subscription remove', FILTER_BY_KEYS)

  var wrongReadSubscription = await netClient.testLocalMethod('readSubscription', { id: createSubscription.id }, {token: user2.token})
  microTest(wrongReadSubscription, { error: 'string' }, 'Wrong readSubscription (Subscription removed)', TYPE_OF)

  // SUBSCRIPTIONS QUERY
  const uuid = require('uuid/v4')

  var rpcCreateSubscriptionN = (n) => netClient.testLocalMethod('createSubscription', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: uuid()
  }, {token: user1.token})

  for (i = 0; i < 20; i++) {
    var createSubscriptionN = await rpcCreateSubscriptionN(i)
    microTest(createSubscriptionN, { success: 'Subscription created' }, 'createSubscriptionN' + i, FILTER_BY_KEYS)
  }

  var queryLastSubscriptions = await netClient.testLocalMethod('queryLastSubscriptions', { dashId: create.id, from: 0, to: 10 }, {token: user1.token})
  microTest(queryLastSubscriptions[0] || [], {dashId: create.id}, 'queryLastSubscriptions', FILTER_BY_KEYS)
  microTest(queryLastSubscriptions.length, 10, 'queryLastSubscriptions Number')

  var getExtendedSubscriptionsByUserId = await netClient.testLocalMethod('getExtendedSubscriptionsByUserId', { }, {token: user2.token})
  microTest(getExtendedSubscriptionsByUserId, 'array', 'getExtendedSubscriptionsByUserId', TYPE_OF, 0)

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
    tags: ['test', 'tag2', 'tag3']
  }

  var createPost = await netClient.testLocalMethod('createPost', post, {token: user_posts.token})
  microTest(createPost, { success: 'Dashboard Posts - created' }, 'createPost', FILTER_BY_KEYS)

  var postPic = {
    mimetype: 'image/png',
    path: path.join(__dirname, '/test_send2.png')
  }

  var addPostPic = await netClient.testLocalMethod('addPostPic', { id: createPost.id, pic: postPic }, {token: user_posts.token})
  microTest(addPostPic, { success: 'Dashboard Posts - pic updated' }, 'addPostPic', FILTER_BY_KEYS)

  var readPost = await netClient.testLocalMethod('readPost', { id: createPost.id }, {token: user_posts.token})
  microTest(readPost, {body: post.body}, 'readPost', FILTER_BY_KEYS)

  var getPostPic = await netClient.testLocalMethod('getPostPic', {id: readPost.pics[0]}, {token: user_posts.token})
  microTest(typeof getPostPic, 'string', 'getPostPic')

  var removePostPic = await netClient.testLocalMethod('removePostPic', { id: createPost.id, picId: readPost.pics[0] }, {token: user_posts.token})
  microTest(removePostPic, { success: 'Dashboard Posts - pic removed' }, 'removePostPic', FILTER_BY_KEYS)

  var updatePost = await netClient.testLocalMethod('updatePost', { id: createPost.id, body: post.body2 }, {token: user_posts.token})
  microTest(updatePost, { success: 'Dashboard Posts - updated' }, 'updatePost', FILTER_BY_KEYS)

  var readPost2 = await netClient.testLocalMethod('readPost', { id: createPost.id }, {token: user_posts.token})
  microTest(readPost2, {body: post.body2}, 'readPost2', FILTER_BY_KEYS)

  var removePost = await netClient.testLocalMethod('removePost', { id: createPost.id }, {token: user_posts.token})
  microTest(removePost, { success: 'Dashboard Posts - removed' }, 'Post remove', FILTER_BY_KEYS)

  var wrongReadPost = await netClient.testLocalMethod('readPost', { id: createPost.id }, {token: user2.token})
  microTest(wrongReadPost, { error: 'string' }, 'Wrong readPost (Post removed)', TYPE_OF)

  // POSTS QUERY
  var rpcCreatePostN = (n) => netClient.testLocalMethod('createPost', {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test ' + n,
    tags: ['test', 'tag2', 'tag3']
  }, {token: user_posts.token})

  for (i = 0; i < 20; i++) {
    var createPostN = await rpcCreatePostN(i)
    microTest(createPostN, { success: 'Dashboard Posts - created' }, 'createPostN' + i, FILTER_BY_KEYS)
  }
    // finishTest()
  var queryLastPosts = await netClient.testLocalMethod('queryLastPosts', { dashId: create.id, from: 10, to: 20 }, {token: user_posts.token})

  // microTest(queryLastPosts, 'object', 'queryLastPosts', TYPE_OF, 2, { dashId: create.id, from: 10, to: 20 })
  microTest(queryLastPosts[0], {userId: user_posts.id}, 'queryLastPosts', FILTER_BY_KEYS)
  microTest(queryLastPosts.length, 10, 'queryLastPosts Number')

  var removeLastPost = await netClient.testLocalMethod('removePost', { id: queryLastPosts[0].id }, {token: user_posts.token})
  microTest(removeLastPost, { success: 'Dashboard Posts - removed' }, 'Last Post remove', FILTER_BY_KEYS)

  var queryLastPostsAfterRemove = await netClient.testLocalMethod('queryLastPosts', { dashId: post.dashId, from: 10, to: 20 }, {token: user2.token})
  microTest(queryLastPostsAfterRemove.length, 9, 'queryLastPosts Number')

  // GUEST READ
  var createGuestReadPost = await netClient.testLocalMethod('createPost', post, {token: user1.token})

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

  var denyGuestReadPost = await netClient.testLocalMethod('readPost', { id: createGuestReadPost.id }, {})
  microTest(denyGuestReadPost, { error: 'string' }, 'Deny Guest readPost', TYPE_OF)

  var denyGuestSubscribe = await netClient.testLocalMethod('createSubscription', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user3.id
  }, {})
  microTest(denyGuestSubscribe, { error: 'string' }, 'Deny Guest Subscribe', TYPE_OF)

  var denyGuestCreatePost = await netClient.testLocalMethod('createPost', {
    dashId: create.id,
    // userId: user3.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {})
  microTest(denyGuestCreatePost, { error: 'string' }, 'Deny Guest Create Post', TYPE_OF)

  var denySubscriberCreatePost = await netClient.testLocalMethod('createPost', {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {token: user2.token})
  microTest(denySubscriberCreatePost, { error: 'string' }, 'Deny Subscriber Create Post', TYPE_OF)

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

  var confirmGuestSubscribe = await netClient.testLocalMethod('createSubscription', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user3.id
  }, {token: user3.token})
  microTest(confirmGuestSubscribe, { success: 'Subscription created' }, 'confirmGuestSubscribe', FILTER_BY_KEYS)

  var confirmGuestCreatePost = await netClient.testLocalMethod('createPost', {
    dashId: create.id,
    // userId: user3.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {})
  microTest(confirmGuestCreatePost, { success: 'Dashboard Posts - created' }, 'confirmGuestCreatePost', FILTER_BY_KEYS)

  var confirmSubscriberCreatePost = await netClient.testLocalMethod('createPost', {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {token: user2.token})
  microTest(confirmSubscriberCreatePost, { success: 'Dashboard Posts - created' }, 'confirmSubscriberCreatePost', FILTER_BY_KEYS)

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

  var allowGuestReadPost = await netClient.testLocalMethod('readPost', { id: createGuestReadPost.id }, {})
  microTest(allowGuestReadPost, {body: post.body}, 'Guest readPost', FILTER_BY_KEYS)

  var allowGuestSubscribe = await netClient.testLocalMethod('createSubscription', {
    dashId: create.id,
    roleId: 'subscriber',
    userId: user4.id
  }, {token: user4.token})
  microTest(allowGuestSubscribe, { success: 'Subscription created' }, 'allowGuestSubscribe', FILTER_BY_KEYS)

  var allowGuestCreatePost = await netClient.testLocalMethod('createPost', {
    dashId: create.id,
    // userId: user3.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {})
  microTest(allowGuestCreatePost, { success: 'Dashboard Posts - created' }, 'allowGuestCreatePost', FILTER_BY_KEYS)

  var allowSubscriberCreatePost = await netClient.testLocalMethod('createPost', {
    dashId: create.id,
    userId: user2.id,
    public: 1,
    to: ['@user1', '#tag'],
    location: [{lat: 39.882730, lng: 18.386065}],
    body: 'test post',
    tags: ['test', 'tag2', 'tag3']
  }, {token: user2.token})
  microTest(allowSubscriberCreatePost, { success: 'Dashboard Posts - created' }, 'allowGuestCreatePost', FILTER_BY_KEYS)

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

  await new Promise((resolve) => setTimeout(resolve, 1000))
  return finishTest()
}
module.exports = startTest

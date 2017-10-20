var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var postsSchema = require('./postsSchema')
var subscriptionsSchema = require('./subscriptionsSchema')
var jsItemById = { properties: { id: jsFields.id }, required: ['id'] }
var dashId = {
  type: 'number',
  description: 'dash number'
}

var dashOptions = {
  type: 'object'
}

var jsRes = {
  properties: {
    success: { type: 'string' },
    error: { type: 'string' },
    data: { type: 'object' },
    method: { type: 'string' },
    type: { type: 'string' },
    id: { type: 'string' }
  },
  'additionalProperties': true
}
var subtestRes = { properties: { count: { type: 'integer' }, success: { type: 'string' }, error: { type: 'string' } } }
var testRes = { additionalProperties: true, properties: { success: { type: 'string' }, error: { type: 'string' }, subtests: { type: 'array', items: subtestRes } } }

var jsInfo = { properties: { id: dashId, name: jsFields.name, description: jsFields.description, options: dashOptions, tags: jsFields.tags, maps: jsFields.maps, pics: {type: 'array'} } }
var jsRead = { properties: { id: dashId, name: jsFields.name, description: jsFields.description, options: dashOptions, tags: jsFields.tags, maps: jsFields.maps, pics: {type: 'array'}, roles: {type: 'object'} } }
var jsQueryRes = { type: 'array', items: jsInfo }

var jsRoleProp = { id: jsFields.id, dashId: dashId, name: jsFields.name, public: jsFields.public, description: jsFields.description, tags: jsFields.tags, permissions: jsFields.rolePermissions }
var jsRoleUpdateProp = { id: jsFields.id, name: jsFields.name, public: jsFields.public, description: jsFields.description, tags: jsFields.tags, permissions: jsFields.rolePermissions }

var toBool = (string, defaultVal = false) => {
  if (typeof string === 'undefined') return defaultVal
  if (typeof string === 'boolean') return string
  if (typeof string === 'string' && string === 'true') return true
  return false
}
// var jsCanReq = { properties: { data: { type: 'object' } } }
// var jsCanRes = { properties: { success: { type: 'string' }, error: { type: 'string' } } }

module.exports = {
  net: {
    'channels': {
      'httpPublic': {
        'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPublicPort || '10080'}`,
        'cors': process.env.netCors || process.env.netHost || '127.0.0.1'
      },
      'http': { 'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPort || '10081'}` }
    }
  },
  exportToPublicApi: toBool(process.env.exportToPublicApi, true),
  rpcOut: { },
  eventsIn: {
    'getPermissions': {
      method: 'getPermissions'
    }
  },
  eventsOut: {
    'testRemoteEvent': {
      multipleResponse: true,
      requestSchema: false,
      responseSchema: false
    },
    'createPost': {
      multipleResponse: false,
      requestSchema: false,
      responseSchema: false
    }
  },
  methods: {
    'getPermissions': {
      public: false,
      responseType: 'response',
      requestSchema: { properties: { id: jsFields.id } },
      responseSchema: { properties: { permissions: jsFields.permissions } }
    },
    'create': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsRead.properties, required: [ 'name', 'maps' ] },
      responseSchema: jsRes
    },
    'info': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemById,
      responseSchema: jsInfo
    },
    'read': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: { id: dashId }, required: ['id'] },
      responseSchema: jsRead
    },
    'update': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsInfo.properties, required: [ 'id' ] },
      responseSchema: jsRes
    },
    'updatePic': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: dashId, pic: jsFields.pic },
        required: [ 'id', 'pic' ]
      },
      responseSchema: false
    },
    'getPic': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: { id: {type: 'string'}, size: {type: 'string'} }, required: [ 'id' ] },
      responseSchema: false
    },
    'remove': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsInfo.properties, required: [ 'id' ] },
      responseSchema: jsRes
    },
    'createRole': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: jsRoleProp,
        required: [ 'dashId', 'permissions', 'slug' ]
      },
      responseSchema: jsRes
    },
    'updateRole': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: jsRoleUpdateProp,
        required: [ 'id' ]
      },
      responseSchema: jsRes
    },
    'readRole': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemById,
      responseSchema: {
        properties: jsRoleProp
      }
    },
    'removeRole': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemById,
      responseSchema: jsRes
    },
    'queryByTimestamp': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['from'], properties: { from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: jsQueryRes
    },
    'queryLastDashboards': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['from'], properties: { from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: jsQueryRes
    },
    'getDashboardsMeta': {
      public: true,
      responseType: 'response',
      requestSchema: { type: 'object' },
      responseSchema: { properties: { count: { type: 'integer' }, tags: { type: 'array' } } }
    },
    'test': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: testRes
    },
    // SUBSCRIPTIONS
    getSubscriptionByDashIdAndUserId: subscriptionsSchema.methods.getByDashIdAndUserId,
    subscriptionCan: subscriptionsSchema.methods.can,
    createSubscription: subscriptionsSchema.methods.create,
    createRawSubscription: subscriptionsSchema.methods.createRaw,
    readSubscription: subscriptionsSchema.methods.read,
    readMultipleSubscriptions: subscriptionsSchema.methods.readMultiple,
    updateSubscription: subscriptionsSchema.methods.update,
    removeSubscription: subscriptionsSchema.methods.remove,
    getExtendedSubscriptionsByUserId: subscriptionsSchema.methods.getExtendedByUserId,
    queryLastSubscriptions: subscriptionsSchema.methods.queryLast,
    // POSTS
    createPost: postsSchema.methods.create,
    readPost: postsSchema.methods.read,
    updatePost: postsSchema.methods.update,
    removePost: postsSchema.methods.remove,
    addPostPic: postsSchema.methods.addPic,
    getPostPic: postsSchema.methods.getPic,
    removePostPic: postsSchema.methods.removePic,
    queryLastPosts: postsSchema.methods.queryLastPosts
  }
}

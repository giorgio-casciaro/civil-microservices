var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var postsSchema = require('./postsSchema')
var jsItemById = { properties: { id: jsFields.id }, required: ['id'] }
var dashId = {
  type: 'number',
  description: 'dash number'
}
var subscriptionId = {
  type: 'string',
  description: 'dash number + _ + subscription number ',
  pattern: '^[0-9]*_[0-9]*$'
}
var jsItemBySubscriptionId = { properties: { id: subscriptionId }, required: ['id'] }

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

var jsInfo = { properties: { id: dashId, name: jsFields.name, description: jsFields.description, public: jsFields.public, tags: jsFields.tags, maps: jsFields.maps } }
var jsRead = { properties: { id: dashId, name: jsFields.name, description: jsFields.description, public: jsFields.public, tags: jsFields.tags, maps: jsFields.maps } }
var jsQueryRes = { type: 'array', items: jsInfo }

var jsRoleProp = { id: jsFields.id, dashId: dashId, slug: jsFields.slug, name: jsFields.name, public: jsFields.public, description: jsFields.description, tags: jsFields.tags, permissions: jsFields.rolePermissions }
var jsRoleUpdateProp = { id: jsFields.id, slug: jsFields.slug, name: jsFields.name, public: jsFields.public, description: jsFields.description, tags: jsFields.tags, permissions: jsFields.rolePermissions }

var jsSubscriptionProp = { id: subscriptionId, dashId: dashId, roleId: jsFields.id, role: jsFields.slug, tags: jsFields.tags, userId: jsFields.id }
var jsSubscriptionUpdateProp = { id: subscriptionId, roleId: jsFields.id, role: jsFields.slug, tags: jsFields.tags }

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
    // 'getPermissions': {
    //   multipleResponse: true,
    //   requestSchema: jsCanReq,
    //   responseSchema: jsCanRes
    // }
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
      requestSchema: { properties: jsInfo.properties, required: [ 'id' ] },
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
    'createSubscription': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: jsSubscriptionProp,
        required: [ 'dashId', 'role', 'roleId', 'userId' ]
      },
      responseSchema: jsRes
    },
    'readSubscription': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemBySubscriptionId,
      responseSchema: {
        properties: jsSubscriptionProp
      }
    },
    'updateSubscription': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsSubscriptionUpdateProp, required: [ 'id' ] },
      responseSchema: jsRes
    },
    'removeSubscription': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemBySubscriptionId,
      responseSchema: jsRes
    },
    'getUserSubscriptions': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: {} },
      responseSchema: { type: 'array' }
    },
    'queryLastSubscriptions': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['from', 'dashId'], properties: { dashId, from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: { type: 'array', items: { properties: jsSubscriptionProp } }
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

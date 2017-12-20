var addExtraSchema = function (prefix, extraSchema, schema) {
  for (var itemName in extraSchema) {
    for (var subitemName in extraSchema[itemName]) {
      if (itemName === 'methods') {
        schema[itemName][prefix + subitemName[0].toUpperCase() + subitemName.substr(1)] = extraSchema[itemName][subitemName]
      } else {
        schema[itemName][subitemName] = extraSchema[itemName][subitemName]
        if (schema[itemName][subitemName].method)schema[itemName][subitemName].method = prefix + schema[itemName][subitemName].method[0].toUpperCase() + schema[itemName][subitemName].method.substr(1)
      }
    }
  }
}

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
var jsRead = { properties: { id: dashId, name: jsFields.name, description: jsFields.description, options: dashOptions, tags: jsFields.tags, maps: jsFields.maps, pics: {type: 'array'}, roles: {type: 'object'}, subscriptionsMeta: {type: 'object'}, postsMeta: {type: 'object'}, postsToConfirmMeta: {type: 'array'}, subscriptionsToConfirmMeta: {type: 'array'} } }
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

var schema = {
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
  rpcOut: {
    'readUser': {
      to: 'users',
      method: 'read',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
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
    'POST_CREATED': {
      multipleResponse: false,
      requestSchema: false,
      responseSchema: false
    },
    'POST_UPDATED': {
      multipleResponse: false,
      requestSchema: false,
      responseSchema: false
    },
    'POST_REMOVED': {
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
    'listLastDashboards': {
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
    }
  }
}
addExtraSchema('posts', require('./postsSchema'), schema)
addExtraSchema('subscriptions', require('./subscriptionsSchema'), schema)
console.log('SCHEMA ', schema)
module.exports = schema

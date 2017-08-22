var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var jsItemById = { properties: { id: jsFields.id }, required: ['id'] }
var jsRes = {
  properties: {
    success: { type: 'string' },
    error: { type: 'string' },
    data: { type: 'object' },
    method: { type: 'string' },
    type: { type: 'string' },
    id: jsFields.id
  },
  'additionalProperties': true
}

var testRes = { additionalProperties: true, properties: { success: { type: 'string' }, error: { type: 'string' }, subtests: { type: 'array', items: subtestRes } } }
var subtestRes = { properties: { count: { type: 'integer' }, success: { type: 'string' }, error: { type: 'string' } } }

var jsRead = { properties: { id: jsFields.id, name: jsFields.name, public: jsFields.public, tags: jsFields.tags } }
var jsReadPrivate = { properties: { id: jsFields.id, name: jsFields.name, public: jsFields.public, tags: jsFields.tags, maps: jsFields.maps } }
var jsQueryRes = { type: 'array', items: jsRead }

var toBool = (string, defaultVal = false) => {
  if (typeof string === 'undefined') return defaultVal
  if (typeof string === 'boolean') return string
  if (typeof string === 'string' && string === 'true') return true
  return false
}
var jsCanReq = { properties: { data: { type: 'object' } } }
var jsCanRes = { properties: { success: { type: 'string' }, error: { type: 'string' } } }

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
    'read': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemById,
      responseSchema: jsRead
    },
    'readPrivate': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemById,
      responseSchema: jsReadPrivate
    },
    'update': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsRead.properties, required: [ 'id' ] },
      responseSchema: jsRes
    },
    'updatePic': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, pic: jsFields.pic },
        required: [ 'id', 'pic' ]
      },
      responseSchema: false
    },
    'getPic': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemById,
      responseSchema: false
    },
    'remove': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemById,
      responseSchema: jsRes
    },
    'setRole': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { dashId: jsFields.id, slug: jsFields.slug, name: jsFields.name, description: jsFields.description, permissions: jsFields.permissions },
        required: [ 'dashId', 'permissions', 'slug' ]
      },
      responseSchema: jsRes
    },
    'getRole': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { dashId: jsFields.id, slug: jsFields.slug},
        required: [ 'dashId', 'slug']
      },
      responseSchema: {
        properties: { dashId: jsFields.id, slug: jsFields.slug, name: jsFields.name, description: jsFields.description, permissions: jsFields.permissions },
        required: [ 'dashId', 'permissions', 'slug' ]
      }
    },
    'createDashUser': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { dashId: jsFields.id, role: jsFields.id },
        required: [ 'dashId' ]
      },
      responseSchema: jsRes
    },
    'readDashUser': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemById,
      responseSchema: jsRead
    },
    'updateDashUser': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsRead.properties, required: [ 'id' ] },
      responseSchema: jsRes
    },
    'queryByTimestamp': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['from'], properties: { from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: jsQueryRes
    },
    'test': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: testRes
    }
  }
}

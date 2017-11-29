var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var ip = require('./getIp')
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
        'url': `${ip}:${process.env.netHostHttpPublicPort || '10080'}`,
        'cors': process.env.netCors || ip || '127.0.0.1'
      },
      'http': { 'url': `${ip || '127.0.0.1'}:${process.env.netHostHttpPort || '10081'}` }
    }
  },
  exportToPublicApi: toBool(process.env.exportToPublicApi, true),
  rpcOut: {
    'readSubscription': {
      to: 'dashboards',
      method: 'subscriptionsReadByDashIdAndUserId',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
  eventsIn: {
    'testEvent': {
      method: 'testEvent'
    },
    'testRemoteEvent': {
      method: 'triggerEvent'
    },
    'POST_MUTATIONS': {
      method: 'POST_MUTATIONS'
    },
    'NOTIFICATION_CREATED': {
      method: 'NOTIFICATION_CREATED'
    }
  },
  eventsOut: {},
  methods: {
    'testEvent': {
      public: false,
      responseType: 'response',
      requestSchema: {'additionalProperties': true, properties: {}},
      responseSchema: {'additionalProperties': true, properties: {}}
    },
    'POST_MUTATIONS': {
      public: false,
      responseType: 'aknowlegment',
      requestSchema: {properties: {id: {'type': 'string'}, mutations: {'type': 'array'}, dashId: {'type': 'string'}, toTags: {'type': 'array'}, toRoles: {'type': 'array'}}},
      responseSchema: false
    },
    'NOTIFICATION_CREATED': {
      public: false,
      responseType: 'aknowlegment',
      requestSchema: false,
      responseSchema: false
    },
    'triggerEvent': {
      public: false,
      responseType: 'aknowlegment',
      requestSchema: false,
      responseSchema: false
    },
    'getDashEvents': {
      public: true,
      responseType: 'stream',
      requestSchema: { required: ['dashId'], properties: { dashId: {'type': 'string'}, token: {'type': 'string'} } },
      responseSchema: false
      // requestSchema: {'additionalProperties': true, properties: {}},
      // responseSchema: {'additionalProperties': true, properties: {}}
    },
    'getUserEvents': {
      public: true,
      responseType: 'stream',
      requestSchema: { properties: { token: {'type': 'string'} } },
      responseSchema: false
      // requestSchema: {'additionalProperties': true, properties: {}},
      // responseSchema: {'additionalProperties': true, properties: {}}
    }
  }
}

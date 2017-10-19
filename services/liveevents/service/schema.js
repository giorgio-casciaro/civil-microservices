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
  rpcOut: {},
  eventsIn: {
    'testEvent': {
      method: 'testEvent'
    },
    'testRemoteEvent': {
      method: 'triggerEvent'
    },
    'createPost': {
      method: 'triggerEvent'
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
    'triggerEvent': {
      public: false,
      responseType: 'aknowlegment',
      requestSchema: false,
      responseSchema: false
    },
    'getEvents': {
      public: true,
      responseType: 'stream',
      requestSchema: false,
      responseSchema: false
      // requestSchema: {'additionalProperties': true, properties: {}},
      // responseSchema: {'additionalProperties': true, properties: {}}
    }
  }
}

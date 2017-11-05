var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var jsRes = {
  properties: {
    success: { type: 'string' },
    error: { type: 'string' },
    data: { type: 'object' },
    ids: { type: 'array' }
  }
  // 'additionalProperties': true
}
var jsRead = { properties: {id: {type: 'string'}, userId: {type: 'string'}, objectId: {type: 'string'}, type: {type: 'string'}, data: {type: 'object'}, readed: {type: 'number'}} }

module.exports = {
  eventsIn: {
  },
  eventsOut: {
  },
  methods: {
    'create': {
      public: false,
      responseType: 'response',
      requestSchema: { properties: Object.assign({users: {type: 'array'}}, jsRead.properties), required: [ 'users' ] },
      responseSchema: jsRes
    },
    'read': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: {id: {type: 'string'}}, required: [ 'id' ] },
      responseSchema: jsRead
    },
    'readed': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: {id: {type: 'string'}}, required: [ 'id' ] },
      responseSchema: jsRes
    },
    'readedByObjectId': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: {objectId: {type: 'string'}}, required: [ 'objectId' ] },
      responseSchema: jsRes
    },
    'lastsByUserId': {
      public: true,
      responseType: 'response',
      requestSchema: { },
      responseSchema: {type: 'array'}
    }
  }
}

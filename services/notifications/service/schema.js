var toBool = (string, defaultVal = false) => {
  if (typeof string === 'undefined') return defaultVal
  if (typeof string === 'boolean') return string
  if (typeof string === 'string' && string === 'true') return true
  return false
}
var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var userId = { type: 'string' }
var dashId = { type: 'string' }
var location = { type: 'array', items: { type: 'object', properties: { lat: {type: 'number'}, lng: {type: 'number'} }, required: ['lat', 'lng'] } }
var pics = { type: 'array', items: { type: 'string' } }

var jsRes = {
  properties: {
    success: { type: 'string' },
    error: { type: 'string' },
    data: { type: 'object' },
    method: { type: 'string' },
    type: { type: 'string' },
    id: { type: 'string' }
  }
  // 'additionalProperties': true
}
var loginRes = { properties: {
  success: { type: 'string' },
  error: { type: 'string' },
  method: { type: 'string' },
  type: { type: 'string' },
  token: { type: 'string' },
  currentState: { type: 'object' },
  id: { type: 'string' }
}}
var meta = {
  confirmed: { type: 'boolean' },
  deleted: { type: 'boolean' },
  updated: { type: 'number' },
  created: { type: 'number' }
}
var sendedToInfo = {
  type: 'array',
  items: {
    channel: { type: 'string' },
    success: { type: 'string' },
    error: { type: 'string' },
    data: { type: 'object' }
  }
}
var jsProp = {id: {type: 'string'}, meta, userId: {type: 'string'}, type: {type: 'string'}, objectId: {type: 'string'}, data: {type: 'object'}, readed: {type: 'boolean'}, toSend: {type: 'boolean'}, sendedToInfo}
var jsEntity = {type: 'object', properties: jsProp}
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
  rpcOut: {
    'readNotification': {
      to: 'notifications',
      method: 'read',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
  eventsIn: {
    'POST_CREATED': {
      method: 'postEvent'
    },
    'POST_UPDATED': {
      method: 'postEvent'
    },
    'POST_REMOVED': {
      method: 'postEvent'
    },
    'TEST_POST_EVENT': {
      method: 'postEvent'
    }
  },
  eventsOut: {
    'NOTIFICATION_CREATED': {
      multipleResponse: false,
      requestSchema: false,
      responseSchema: false
    },
    'TEST_POST_EVENT': {
      multipleResponse: false,
      requestSchema: false,
      responseSchema: false
    }
  },
  methods: {
    'createMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {items: {type: 'array', items: {type: 'object', properties: jsProp, required: [ 'userId', 'objectId' ]}}, extend: jsEntity},
        required: [ 'items' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'rawMutateMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {mutation: {type: 'string'}, items: {type: 'array', items: {type: 'object', properties: {data: jsEntity, id: { type: 'string' }}}}, extend: jsEntity},
        required: [ 'items', 'mutation' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'updateMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {items: {type: 'array', items: jsEntity}, extend: jsEntity},
        required: [ 'items' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'readMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { ids: { type: 'array', items: { type: 'string' } } },
        required: [ 'ids' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsEntity}, errors: {type: 'array'}}}
    },
    'deleteMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { ids: { type: 'array', items: { type: 'string' } } },
        required: [ 'ids' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'confirmMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { ids: { type: 'array', items: { type: 'string' } } },
        required: [ 'ids' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'addTagsMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {items: {type: 'array', items: jsEntity}, extend: jsEntity},
        required: [ 'items' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'removeTagsMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {items: {type: 'array', items: jsEntity}, extend: jsEntity},
        required: [ 'items' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'postEvent': {
      public: false,
      responseType: 'response',
      requestSchema: { properties: { view: {type: 'object'}, users: {type: 'array', items: {type: 'string'}} } },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
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
    'list': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: { from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: {properties: {results: {type: 'array', items: jsEntity}, errors: {type: 'array'}}}
    },
    'listByUserId': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['userId'], properties: { userId: { type: 'string' }, from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: {properties: {results: {type: 'array', items: jsEntity}, errors: {type: 'array'}}}
    }

  }
}

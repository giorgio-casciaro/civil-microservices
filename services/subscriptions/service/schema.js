var toBool = (string, defaultVal = false) => {
  if (typeof string === 'undefined') return defaultVal
  if (typeof string === 'boolean') return string
  if (typeof string === 'string' && string === 'true') return true
  return false
}
var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var subscriptionId = {
  type: 'string',
  description: 'dash number + _ + subscription number '
  // pattern: '^[0-9]*_[0-9]*$'
}
var dashId = {
  type: 'string',
  description: 'dash string'
}
var roleId = {
  type: 'string',
  description: 'Role slug as id',
  'minLength': 3
}
var jsRes = {
  properties: {
    success: { type: 'boolean' },
    error: { type: 'string' },
    data: { type: 'object' },
    method: { type: 'string' },
    type: { type: 'string' },
    id: { type: 'string' }
  }
  // 'additionalProperties': true
}

var jsItemBySubscriptionId = { properties: { id: subscriptionId }, required: ['id'] }
var meta = {
  confirmed: { type: 'boolean' },
  deleted: { type: 'boolean' },
  updated: { type: 'number' },
  created: { type: 'number' }
}
var jsProp = { id: subscriptionId, dashId: dashId, roleId, tags: jsFields.tags, userId: { type: 'string' }, meta, notifications: { type: 'array' }, role: { type: 'object' } }
var jsUpdateProp = { id: subscriptionId, roleId, tags: jsFields.tags, meta }

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
    'readUser': {
      to: 'users',
      method: 'read',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
  eventsIn: {
  },
  eventsOut: {
  },
  methods: {
    'createMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {items: {type: 'array', items: jsProp}, extend: jsProp},
        required: [ 'items' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'rawMutateMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {mutation: {type: 'string'}, items: {type: 'array', items: {type: 'object', properties: {data: jsProp, id: { type: 'string' }}}}, extend: jsProp},
        required: [ 'items', 'mutation' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'updateMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {items: {type: 'array', items: jsProp}, extend: jsProp},
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
      responseSchema: {properties: {results: {type: 'array', items: jsProp}, errors: {type: 'array'}}}
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
    'list': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['dashId'], properties: { dashId, from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: {properties: {results: {type: 'array', items: jsProp}, errors: {type: 'array'}}}
    },
    'create': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: jsProp,
        required: [ 'dashId' ]
      },
      responseSchema: jsRes
    },
    'read': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemBySubscriptionId,
      responseSchema: {
        properties: jsProp
      }
    },
    'confirm': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemBySubscriptionId,
      responseSchema: jsRes
    },
    'update': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsUpdateProp, required: [ 'id' ] },
      responseSchema: jsRes
    },
    'remove': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemBySubscriptionId,
      responseSchema: jsRes
    },
    'getExtendedByUserId': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: {} },
      responseSchema: { type: 'array' }
    },
    'readByDashIdAndUserId': {
      public: false,
      responseType: 'response',
      requestSchema: { required: ['dashId'], properties: { dashId, userId: { type: 'string' } } },
      responseSchema: {
        properties: jsProp
      }
    },
    'listLast': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['from', 'dashId'], properties: { dashId, from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: { type: 'array', items: { properties: jsProp } }
    },
    'listByDashIdTagsRoles': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['dashId'], properties: { dashId, roles: { type: 'array' }, tags: { type: 'array' } } },
      responseSchema: { type: 'array' }
    }
  }
}

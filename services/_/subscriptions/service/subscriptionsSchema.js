var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var subscriptionId = {
  type: 'string',
  description: 'dash number + _ + subscription number '
  // pattern: '^[0-9]*_[0-9]*$'
}
var dashId = {
  type: 'number',
  description: 'dash number'
}
var roleId = {
  type: 'string',
  description: 'Role slug as id',
  'minLength': 3
}
var jsRes = {
  properties: {
    success: { type: 'string' },
    error: { type: 'string' },
    data: { type: 'object' },
    method: { type: 'string' },
    type: { type: 'string' },
    id: subscriptionId
  },
  'additionalProperties': true
}

var jsItemBySubscriptionId = { properties: { id: subscriptionId }, required: ['id'] }
var meta = {
  confirmed: { type: 'boolean' },
  deleted: { type: 'boolean' },
  updated: { type: 'number' },
  created: { type: 'number' }
}
var jsProp = { id: subscriptionId, dashId: dashId, roleId, tags: jsFields.tags, userId: jsFields.id, meta, notifications: { type: 'array' }, role: { type: 'object' } }
var jsUpdateProp = { id: subscriptionId, roleId, tags: jsFields.tags, meta }

module.exports = {
  eventsIn: {
  },
  eventsOut: {
  },
  methods: {
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
      requestSchema: { required: ['dashId'], properties: { dashId, userId: jsFields.id } },
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

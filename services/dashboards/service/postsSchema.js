var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var postId = {
  type: 'string',
  description: 'dash number + _ + post number ',
  pattern: '^[0-9]*_[0-9]*$'
}
var dashId = {
  type: 'number',
  description: 'dash number'
}
var subscriptionId = {
  type: 'string',
  description: 'dash number + _ + subscription number ',
  pattern: '^[0-9]*_[0-9]*$'
}
var jsItemByUUID = { properties: { id: jsFields.id }, required: ['id'] }
var jsItemByPostId = { properties: { id: postId }, required: ['id'] }

var jsRes = {
  properties: {
    success: { type: 'string' },
    error: { type: 'string' },
    data: { type: 'object' },
    method: { type: 'string' },
    type: { type: 'string' },
    id: postId
  },
  'additionalProperties': true
}
var goelocation = { type: 'array', items: { type: 'object', properties: { lat: {type: 'number'}, lng: {type: 'number'} }, required: ['lat', 'lng'] } }
var pics = { type: 'array', items: jsFields.id }
var to = { type: 'array', items: { type: 'string' } }
var jsProp = { id: postId, name: jsFields.name, userId: jsFields.id, subscription: { type: 'object' }, dashId: dashId, public: jsFields.public, body: { type: 'string' }, location: goelocation, tags: jsFields.tags, to, pics, _confirmed: { type: 'number' }, _deleted: { type: 'number' }, updated: { type: 'string' }, created: { type: 'string' } }
var jsUpdate = { id: postId, name: jsFields.name, public: jsFields.public, body: { type: 'string' }, location: goelocation, tags: jsFields.tags, to, pics, _confirmed: { type: 'number' }, _deleted: { type: 'number' } }
var jsQueryRes = { type: 'array', items: {properties: jsProp} }

module.exports = {
  eventsIn: {
  },
  eventsOut: {
  },
  methods: {
    'create': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsProp, required: [ 'dashId', 'body' ] },
      responseSchema: jsRes
    },
    'read': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemByPostId,
      responseSchema: { properties: jsProp }
    },
    'update': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: jsUpdate, required: [ 'id' ] },
      responseSchema: jsRes
    },
    'addPic': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: postId, pic: jsFields.pic },
        required: [ 'id', 'pic' ]
      },
      responseSchema: false
    },
    'removePic': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: postId, picId: jsFields.string },
        required: [ 'id', 'picId' ]
      },
      responseSchema: false
    },
    'getPic': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemByUUID,
      responseSchema: false
    },
    'remove': {
      public: true,
      responseType: 'response',
      requestSchema: jsItemByPostId,
      responseSchema: jsRes
    },
    'queryLastPosts': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { dashId: dashId, from: { type: 'number' }, to: { type: 'number' } },
        required: [ 'dashId' ]
      },
      responseSchema: jsQueryRes
    }
  }
}
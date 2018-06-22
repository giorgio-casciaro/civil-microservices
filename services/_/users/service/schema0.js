var toBool = (string, defaultVal = false) => {
  if (typeof string === 'undefined') return defaultVal
  if (typeof string === 'boolean') return string
  if (typeof string === 'string' && string === 'true') return true
  return false
}
var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var userId = { type: 'string' }
var pic = {
  type: 'object',
  properties: { sizes: { type: 'array' }, picId: { type: 'string' } },
  required: ['picId', 'sizes']
}
var pics = { type: 'array', items: pic }
var picFile = { type: 'object', properties: { mimetype: { type: 'string' }, path: { type: 'string' } }, required: ['path'] }
var jsRes = {
  properties: {
    __RESULT_TYPE__: { type: 'string' },
    success: { type: 'string' },
    error: { type: 'string' },
    data: { type: 'object' },
    method: { type: 'string' },
    type: { type: 'string' },
    id: { type: 'string' },
    mutation: {type: 'string'},
    mutationData: { type: 'object' }
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
// var jsProp = { id: userId, dashId: dashId, roleId, tags: jsFields.tags, userId: { type: 'string' }, meta, notifications: { type: 'array' }, role: { type: 'object' } }
var jsProp = { id: userId, name: { type: 'string' }, public: { type: 'boolean' }, email: jsFields.email, tags: jsFields.tags, pics, meta, options: { type: 'object' }, notifications: { type: 'object' } }

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
    'USERS_ENTITY_MUTATION': {
      multipleResponse: false,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'USERS_CREATED': {
      multipleResponse: false,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
  methods: {
    'serviceInfo': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: {properties: {'schema': {type: 'object'}, 'mutations': {type: 'object'}}}
    },
    'status': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: {type: 'object', 'additionalProperties': true}
    },
    'createMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {items: {type: 'array', items: {type: 'object', properties: jsProp, required: [ 'email' ]}}, extend: jsProp},
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
    'rawReadMulti': {
      public: false,
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
        properties: {items: {type: 'array', items: jsProp}, extend: jsProp},
        required: [ 'items' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'removeTagsMulti': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {items: {type: 'array', items: jsProp}, extend: jsProp},
        required: [ 'items' ]
      },
      responseSchema: {properties: {results: {type: 'array', items: jsRes}, errors: {type: 'array'}}}
    },
    'list': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: { from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: {properties: {results: {type: 'array', items: jsProp}, errors: {type: 'array'}}}
    },
    'readEmailConfirmationCode': {
      public: false,
      responseType: 'response',
      requestSchema: { properties: { id: jsFields.id }, required: ['id'] },
      responseSchema: { properties: { emailConfirmationCode: jsFields.emailConfirmationCode } }
    },
    'confirmEmail': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { email: jsFields.email, emailConfirmationCode: jsFields.emailConfirmationCode },
        required: [ 'email', 'emailConfirmationCode' ]
      },
      responseSchema: jsRes
    },
    'updatePassword': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, password: jsFields.password, confirmPassword: jsFields.password, oldPassword: jsFields.password },
        required: [ 'id', 'password', 'confirmPassword', 'oldPassword' ]
      },
      responseSchema: jsRes
    },
    'assignPassword': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { email: jsFields.email, password: jsFields.password, confirmPassword: jsFields.password },
        required: [ 'email', 'password', 'confirmPassword' ]
      },
      responseSchema: jsRes
    },
    'login': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { email: jsFields.email, password: jsFields.password },
        required: [ 'email', 'password' ]
      },
      responseSchema: loginRes
    },
    'createGuest': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { publicName: jsFields.name, email: jsFields.email, info: {type: 'object'} },
        required: [ 'email', 'publicName' ]
      },
      responseSchema: jsRes
    },
    'refreshToken': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: loginRes
    },
    'logout': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, email: jsFields.email },
        required: [ 'email', 'id' ]
      },
      responseSchema: jsRes
    },
    'addPic': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: {type: 'string'}, pic: picFile },
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
    'deletePic': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: { id: {type: 'string'} }, required: [ 'id' ] },
      responseSchema: false
    },
    'updatePersonalInfo': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, publicName: { type: 'string' }, firstName: jsFields.firstName, lastName: jsFields.lastName, birth: jsFields.birth },
        required: [ 'id' ]
      },
      responseSchema: jsRes
    }
  }
}

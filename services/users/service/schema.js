var jsFields = require('sint-bit-utils/utils/JSchemaFields')
var jsUserById = { properties: { id: jsFields.id }, required: ['id'] }
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
var loginRes = { properties: {
  success: { type: 'string' },
  error: { type: 'string' },
  method: { type: 'string' },
  type: { type: 'string' },
  token: { type: 'string' },
  currentState: { type: 'object' }
}}
var testRes = { additionalProperties: true, properties: { success: { type: 'string' }, error: { type: 'string' }, subtests: { type: 'array', items: subtestRes } } }
var subtestRes = { properties: { count: { type: 'integer' }, success: { type: 'string' }, error: { type: 'string' } } }

var jsRead = { properties: { id: jsFields.id, publicName: jsFields.name, hasPic: jsFields.hasPic, tags: jsFields.tags } }
var jsReadPrivate = { properties: { id: jsFields.id, email: jsFields.email, emailStatus: jsFields.emailStatus, publicName: jsFields.name, hasPic: jsFields.hasPic, tags: jsFields.tags } }
var jsQueryRes = { type: 'array', items: jsRead }

var jsCanReq = { properties: { data: { type: 'object' } } }
var toBool = (string, defaultVal = false) => {
  if (typeof string === 'undefined') return defaultVal
  if (typeof string === 'boolean') return string
  if (typeof string === 'string' && string === 'true') return true
  return false
}
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
    'getPermissions': {
      multipleResponse: true,
      requestSchema: jsCanReq,
      responseSchema: jsCanRes
    }
  },
  methods: {
    'create': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: { email: jsFields.email }, required: [ 'email' ] },
      responseSchema: jsRes
    },
    'getPermissions': {
      public: false,
      responseType: 'response',
      requestSchema: { properties: { id: jsFields.id } },
      responseSchema: { properties: { permissions: jsFields.permissions } }
    },
    'readEmailConfirmationCode': {
      public: (process.env.NODE_ENV === 'development'),
      responseType: 'response',
      requestSchema: jsUserById,
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
    'read': {
      public: true,
      responseType: 'response',
      requestSchema: jsUserById,
      responseSchema: jsRead
    },
    'readPrivate': {
      public: true,
      responseType: 'response',
      requestSchema: jsUserById,
      responseSchema: jsReadPrivate
    },
    'updatePublicName': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, publicName: jsFields.name },
        required: [ 'id', 'publicName' ]
      },
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
      requestSchema: jsUserById,
      responseSchema: false
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
    'refreshToken': {
      public: true,
      responseType: 'response',
      requestSchema: jsReadPrivate,
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
    'updatePersonalInfo': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, firstName: jsFields.firstName, lastName: jsFields.lastName, birth: jsFields.birth },
        required: [ 'id' ]
      },
      responseSchema: jsRes
    },
    'readPersonalInfo': {
      public: false,
      responseType: 'response',
      requestSchema: jsUserById,
      responseSchema: {
        properties: { id: jsFields.id, firstName: jsFields.firstName, lastName: jsFields.lastName, birth: jsFields.birth },
        required: [ 'id' ]
      }
    },
    'remove': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id },
        required: [ 'id' ]
      },
      responseSchema: jsRes
    },
    'queryByTimestamp': {
      public: false,
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

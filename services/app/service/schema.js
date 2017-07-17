var jsFields = {
  schema: { type: 'object'},
  response: { type: 'object' }
}

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
  rpcOut: {
  },
  eventsIn: {

  },
  eventsOut: {

  },
  methods: {
    'getSchema': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: { properties: { schema: jsFields.schema }, 'additionalProperties': true }
    },
    'getPublicApiSchema': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: { properties: { publicSchema: jsFields.schema }, 'additionalProperties': true }
    },
    'proxy': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {
          service: { type: 'string' },
          method: { type: 'string' },
          data: { type: 'object' },
          meta: { type: 'object' }
        }
      },
      responseSchema: { 'additionalProperties': true }
    }
  }
}

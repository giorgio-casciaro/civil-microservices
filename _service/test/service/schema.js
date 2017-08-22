module.exports = {
  rpcOut: {
    'testRpcNoResponse': {
      to: 'test',
      method: 'testNoResponse',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'testRpcAknowlegment': {
      to: 'test',
      method: 'testAknowlegment',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'testRpcResponse': {
      to: 'test',
      method: 'testResponse',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'testRpcStream': {
      to: 'test',
      method: 'testStream',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
  eventsIn: {
    'testEvent': {
      method: 'testResponse'
    },
    'testEventMulti': {
      method: 'testResponse'
    }
  },
  eventsOut: {
    'testEvent': {
      multipleResponse: false,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'viewReaded': {
      multipleResponse: true,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'viewRemoved': {
      multipleResponse: true,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'viewCreated': {
      multipleResponse: true,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
  methods: {
    'create': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'read': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'update': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'remove': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'createCqrs': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'readCqrs': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'updateCqrs': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'removeCqrs': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'testNoResponse': {
      public: true,
      responseType: 'noResponse',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'testAknowlegment': {
      public: true,
      responseType: 'aknowlegment',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'testResponse': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'testStream': {
      public: true,
      responseType: 'stream',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    }
  }
}

var path = require('path')
module.exports = {
  service: {
    serviceName: process.env.serviceName || 'test',
    schemaPath: path.join(__dirname, '../../sharedSchema/')
  },
  net: {
    'channels': {
      'httpPublic': { 'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPublicPort || '10080'}`},
      'http': { 'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPort || '10081'}` }
    }
  },
  elasticsearch: {
    host: process.env.elasticsearchHost || '127.0.0.1:9200',
    // log: 'trace',
    index: 'views-test',
    type: 'entity-view'
  },
  aerospike: {
    hosts: process.env.aerospikeHosts || '127.0.0.1:3000',
    // log: {level: process.env.aerospikeLogLevel || 4},
    set: process.env.aerospikeSet || 'test',
    mutationsSet: process.env.aerospikeMutationsSet || 'mutationsTest',
    viewsSet: process.env.aerospikeViewsSet || 'viewsTest',
    namespace: process.env.aerospikeNamespace || 'civilconnect' },
  console: { error: process.env.consoleError || true, debug: process.env.consoleDebug || true, log: process.env.consoleLog || true, warn: process.env.consoleWarn || true }
}

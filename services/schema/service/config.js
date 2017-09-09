module.exports = {
  httpHost: process.env.httpHost || '0.0.0.0',
  httpPort: process.env.httpPort || 10000,
  aerospike: {
    hosts: process.env.aerospikeHosts || '127.0.0.1:3000',
    // log: {level: process.env.aerospikeLogLevel || 4},
    set: process.env.aerospikeSet || 'schema',
    namespace: process.env.aerospikeNamespace || 'cc_schema',
    policies: { timeout: 10000 }
  }
}

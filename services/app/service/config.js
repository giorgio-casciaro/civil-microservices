var path = require('path')
module.exports = {
  staticFilesHttpPort: process.env.staticFilesHttpPort || 10070,
  service: {
    serviceName: process.env.serviceName || 'app'
  },
  schemaHost: process.env.schemaHost || 'http://127.0.0.1:10000',
  console: { error: process.env.consoleError || true, debug: process.env.consoleDebug || true, log: process.env.consoleLog || true, warn: process.env.consoleWarn || true }
}

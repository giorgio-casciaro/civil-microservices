const path = require('path')

module.exports = {
  httpHost: process.env.httpHost || '0.0.0.0',
  httpPort: process.env.httpPort || 12000,
  mountPath: process.env.mountPath || path.join(__dirname, '/../../')
}

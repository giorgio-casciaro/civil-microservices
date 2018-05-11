var jesusServer = require('sint-bit-jesus/net.server')
var jesusClient = require('sint-bit-jesus/net.client')
var generateId = require('uuid/v4')
var path = require('path')
var methods = require(path.join(__dirname, './methods'))

process.on('unhandledRejection', (err, p) => {
  console.error(err)
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})
module.exports = async function start () {
  var CONFIG = require('./config')
  console.log(`USERS  getServiceSchema`)
  var getServiceSchema = await require('sint-bit-utils/utils/schema')(CONFIG.schemaHost, require('./schema'), CONFIG.service.serviceName)
  var DI = {
    serviceName: CONFIG.service.serviceName,
    serviceId: CONFIG.service.serviceId || generateId(),
    getMethods: () => methods,
    getMethodsConfig: function (service, exclude) {
      console.log('getMethodsConfig', service, exclude)
      return getServiceSchema('methods', service)
    },
    getNetConfig: (service, exclude) => {
      return getServiceSchema('net', service, exclude)
    },
    getEventsIn: (service, exclude) => getServiceSchema('eventsIn', service, exclude),
    getEventsOut: (service, exclude) => getServiceSchema('eventsOut', service, exclude),
    getRpcOut: (service, exclude) => getServiceSchema('rpcOut', service, exclude)
  }

  var netClient = jesusClient(DI)
  var netServer = jesusServer(DI)

  console.log(`USERS  methods.init(netClient)`)
  await methods.init(netClient)
  console.log(`USERS  netServer.start`)
  netServer.start()
  return {
    DI,
    getServiceSchema,
    netClient,
    netServer
  }
}

var jesusServer = require('sint-bit-jesus/net.server')
var jesusClient = require('sint-bit-jesus/net.client')
var generateId = require('uuid/v4')
var path = require('path')
const getConsole = (serviceName, serviceId, pack) => require('./lib/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var PACKAGE = 'microservice'
var CONSOLE = getConsole(PACKAGE, '----', '-----')

var CONFIG = require('./config')
var getServiceSchema = require('./lib/schema')(CONFIG.schemaHost, require('./schema'), CONFIG.service.serviceName)
var DI = {
  serviceName: CONFIG.service.serviceName,
  serviceId: CONFIG.service.serviceId || generateId(),
  CONSOLE,
  getMethods: () => require(path.join(__dirname, './methods'))(CONSOLE, netClient),
  getMethodsConfig: (service, exclude) => getServiceSchema('methods', service),
  getNetConfig: (service, exclude) => {
    return getServiceSchema('net', service, exclude)
  },
  getEventsIn: (service, exclude) => getServiceSchema('eventsIn', service, exclude),
  getEventsOut: (service, exclude) => getServiceSchema('eventsOut', service, exclude),
  getRpcOut: (service, exclude) => getServiceSchema('rpcOut', service, exclude)
}
var netClient = jesusClient(DI)
var netServer = jesusServer(DI)
// CONSOLE.log('DI', DI)
netServer.start()
module.exports = {
  DI,
  getServiceSchema,
  netClient,
  netServer
}

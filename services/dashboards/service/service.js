module.exports = async function start () {
  // BASE
  var CONFIG = require('./config')
  const getConsole = (serviceName, serviceId, pack) => require('sint-bit-utils/utils/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
  var PACKAGE = 'microservice'
  var CONSOLE = getConsole(PACKAGE, '----', '-----')

  // SERVICES DEPENDECIES
  const wait = require('sint-bit-utils/utils/wait')
  await wait.aerospike(CONFIG.aerospike)
  await wait.service("http://schema:10000/getSchema")
  await wait.service("http://users:10080/login")
  console.log('INIT SCHEMA')

  // DOMAIN
  var jesusServer = require('sint-bit-jesus/net.server')
  var jesusClient = require('sint-bit-jesus/net.client')
  var generateId = require('uuid/v4')
  var path = require('path')
  var getServiceSchema = require('sint-bit-utils/utils/schema')(CONFIG.schemaHost, require('./schema'), CONFIG.service.serviceName)
  var DI = {
    serviceName: CONFIG.service.serviceName,
    serviceId: CONFIG.service.serviceId || generateId(),
    CONSOLE,
    getMethods: async () => await require(path.join(__dirname, './methods'))(CONSOLE, netClient),
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
  require(path.join(__dirname, './methods'))(CONSOLE, netClient)

// CONSOLE.log('DI', DI)
  netServer.start()
  return {
    DI,
    getServiceSchema,
    netClient,
    netServer
  }
}

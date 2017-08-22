module.exports = async function start () {
  // BASE
  var CONFIG = require('./config')
  const getConsole = (serviceName, serviceId, pack) => require('sint-bit-utils/utils/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
  var PACKAGE = 'microservice'
  var CONSOLE = getConsole(PACKAGE, '----', '-----')

  // SERVICES DEPENDECIES
  const wait = require('sint-bit-utils/utils/wait')
  await wait.service("http://schema:10000/getSchema")

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
    getMethods: () => require(path.join(__dirname, './methods'))(CONSOLE, netClient, undefined, getServiceSchema),
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
  require(path.join(__dirname, './methods'))(CONSOLE, netClient)

// STATIC FILES
  var express = require('express')
  var app = express()
  app.use(express.static(path.join(__dirname, '/static')))
  app.listen(CONFIG.staticFilesHttpPort, function () {
    CONSOLE.log('Static files http server started')
  })
// CONSOLE.log('DI', DI)
  netServer.start()
  return {
    DI,
    getServiceSchema,
    netClient,
    netServer
  }
}

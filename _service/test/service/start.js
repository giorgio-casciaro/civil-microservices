var jesusServer = require('sint-bit-jesus/net.server')
var jesusClient = require('sint-bit-jesus/net.client')
var schemaManager = require('sint-bit-schema-manager')
var generateId = require('uuid/v4')
var path = require('path')
const getConsole = (serviceName, serviceId, pack) => require('./lib/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var PACKAGE = 'microservice'
var CONSOLE = getConsole(PACKAGE, '----', '-----')

var serviceConfig = require('./config').service

var schemaClient = schemaManager({ savePath: serviceConfig.schemaPath, serviceName: serviceConfig.serviceName, intervall: 1000, defaultField: 'methods' })

var CONFIG = {
  serviceName: serviceConfig.serviceName,
  serviceId: serviceConfig.serviceId || generateId(),
  // configFile: path.join(__dirname, './config'),
  // methodsFile: path.join(__dirname, './methods'),
  // schemaFile: path.join(__dirname, './schema'),
  // schemaPath: path.join(__dirname, '../../sharedSchema/'),
  CONSOLE,
  getMethods: () => require(path.join(__dirname, './methods'))(CONSOLE, netClient),
  getMethodsConfig: (service, exclude) => schemaClient.get('methods', service),
  getNetConfig: (service, exclude) => schemaClient.get('net', service, exclude),
  getEventsIn: (service, exclude) => schemaClient.get('eventsIn', service, exclude),
  getEventsOut: (service, exclude) => schemaClient.get('eventsOut', service, exclude),
  getRpcOut: (service, exclude) => schemaClient.get('rpcOut', service, exclude)
}
var netClient = jesusClient(CONFIG)
var netServer = jesusServer(CONFIG)

netServer.start()
module.exports = {
  CONFIG,
  schemaClient,
  netClient,
  netServer
}

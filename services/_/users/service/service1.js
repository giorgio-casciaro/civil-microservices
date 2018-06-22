// var generateId = require('uuid/v4')
var path = require('path')
var methods = require(path.join(__dirname, './methods'))
var CONFIG = require('./config')

const {Docker} = require('node-docker-api')

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

const log = (msg, data) => { console.log('\n' + JSON.stringify(['LOG', 'MAIN', msg, data])) }
const debug = (msg, data) => { if (process.env.debugMain)console.log('\n' + JSON.stringify(['DEBUG', 'MAIN', msg, data])) }
const errorLog = (msg, data) => { console.log('\n' + JSON.stringify(['ERROR', 'MAIN', msg, data])); console.error(data) }

var servicesRoundRobinCounter = {}
var getServiceDnsHoststimeout
var serviceDnsHosts
async function getServiceDnsHosts (service) {
  if (serviceDnsHosts) return serviceDnsHosts
  if (getServiceDnsHoststimeout)clearTimeout(getServiceDnsHoststimeout)
  getServiceDnsHoststimeout = setTimeout(() => { serviceDnsHosts = false }, 10000)
  var dns = require('dns')
  serviceDnsHosts = new Promise((resolve, reject) => {
    dns.lookup('tasks.' + service, function (err, addresses, family) {
      console.log('tasks.' + service, {err, addresses, family})
      if (typeof addresses === 'string')addresses = [addresses]
      if (!err) return resolve(addresses)
      dns.lookup(service, function (err, addresses, family) {
        console.log(service, {err, addresses, family})
        if (err) return reject(addresses)
        if (typeof addresses === 'string')addresses = [addresses]
        return resolve(addresses)
      })
    })
  })
  return serviceDnsHosts
}
async function getServiceHost (service) {
  var hosts = await getServiceDnsHosts(service)
  if (hosts.length === 1) return hosts[0]
  var counter = servicesRoundRobinCounter[service] || 0
  if (counter >= hosts.length)counter = 0
  servicesRoundRobinCounter[service] = counter + 1
  return hosts[counter]
}
// async function updateList () {
//   var hosts = await getServiceDnsHosts('users')
//   console.log('getServiceDnsHosts', hosts)
//   try {
//     var services = await docker.service.list()
//     console.log('swarm services', services)
//   } catch (err) {
//     console.log('swarm services error', err)
//   }
//   var list = await docker.container.list()
//   console.log('updateList', list[1].data)
//   // console.log('updateList', list)
//     // .then(containers => containers[0].status())
//     // .then(container => container.stats())
//     // .then(stats => {
//     //   stats.on('data', stat => console.log('Stats: ', stat.toString()))
//     //   stats.on('error', err => console.log('Error: ', err))
//     // })
//     // .catch(error => console.log(error))
// }

process.on('unhandledRejection', (err, p) => {
  console.error(err)
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})
module.exports = async function start () {
  // var CONFIG = require('./config')
  // console.log(`USERS  getServiceSchema`)
  // var getServiceSchema = await require('sint-bit-utils/utils/schema')(CONFIG.schemaHost, require('./schema'), CONFIG.service.serviceName)
  // var DI = {
  //   serviceName: CONFIG.service.serviceName,
  //   serviceId: CONFIG.service.serviceId || generateId(),
  //   getMethods: () => methods,
  //   getMethodsConfig: function (service, exclude) {
  //     console.log('getMethodsConfig', service, exclude)
  //     return getServiceSchema('methods', service)
  //   },
  //   getNetConfig: (service, exclude) => {
  //     return getServiceSchema('net', service, exclude)
  //   },
  //   getEventsIn: (service, exclude) => getServiceSchema('eventsIn', service, exclude),
  //   getEventsOut: (service, exclude) => getServiceSchema('eventsOut', service, exclude),
  //   getRpcOut: (service, exclude) => getServiceSchema('rpcOut', service, exclude)
  // }
  //
  // var netClient = jesusClient(DI)
  // var netServer = jesusServer(DI)
  //
  // console.log(`USERS  methods.init(netClient)`)
  // await methods.init(netClient)
  // console.log(`USERS  netServer.start`)
  // netServer.start()
  // await updateList()
  var netClientListeners = {}
  var netClientListenersByService = {}
  var netClient = {
    testPuppets: {},
    on: (eventName, eventFunction, eventService) => {
      debug('netClient on', eventName, eventFunction, eventService)
      if (eventService) {
        if (!netClientListenersByService[eventName])netClientListenersByService[eventName] = {}
        if (!netClientListenersByService[eventName][eventService])netClientListenersByService[eventName][eventService] = {counter: 0, listeners: []}
        netClientListenersByService[eventName][eventService].listeners.push({eventName, eventFunction, eventService})
      } else {
        if (!netClientListeners[eventName])netClientListeners[eventName] = []
        netClientListeners[eventName].push({eventName, eventFunction, eventService})
      }
      // if (eventService)netClientListeners[eventName] = {eventName, eventFunction, eventService}
    },
    emit: (eventName, eventData) => {
      debug('netClient emit', {eventName, eventData, netClientListenersByService})
      if (netClientListeners[eventName])netClientListeners[eventName].forEach((listener) => listener.eventFunction(eventData))
      if (netClientListenersByService[eventName]) {
        // debug('netClient emit service', {event: netClientListenersByService[eventName]})
        for (var serviceName in netClientListenersByService[eventName]) {
          var service = netClientListenersByService[eventName][serviceName]
          var listenerIndex = service.counter % service.listeners.length
          service.listeners[listenerIndex].eventFunction(eventData)
        }
      }
    },
    off: (eventName, eventFunction) => {
      debug('netClient off', eventName, eventFunction)
      if (netClientListeners[eventName])netClientListeners[eventName] = netClientListeners[eventName].filter((listener) => listener.eventFunction !== eventFunction)
      if (netClientListenersByService[eventName]) {
        for (var service in netClientListenersByService[eventName]) { service.listeners = service.listeners.filter((listener) => listener.eventFunction !== eventFunction) }
      }
    },
    rpc: async (serviceName, methodName, data, meta, asStream) => {
      var host = await getServiceHost(serviceName)
      // console.log('netClient rpc ', {serviceName, host})
      var zeromqClient = require('sint-bit-jesus/clients/zeromq')()
      var response = await zeromqClient.rpc('tcp://' + host + ':81', methodName, data, meta, asStream)
      // console.log('netClient rpc ', {response})
      return response
    },
    push: async (eventName, data, meta) => {}
  }
  await methods.init.exec(netClient)
  var httpServer = require('sint-bit-jesus/servers/http')({methods, config: CONFIG.http})
  var zeromqServer = require('sint-bit-jesus/servers/zeromq')({methods, config: CONFIG.zeromq})
  await httpServer.start()
  await zeromqServer.start()
  return {
    netClient,
    httpServer
    // zeromqServer
  }
}

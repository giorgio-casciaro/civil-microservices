process.on('unhandledRejection', (err, p) => {
  console.error(err)
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

var methods = require('./methods')
var sharedMethods = require('sint-bit-utils/utils/sharedMethods')
var CONFIG = require('./config')
if (!process.env.IPADDRESS)process.env.IPADDRESS = require('os').networkInterfaces()['eth0'][0].address
console.log('process.env', process.env)

module.exports = async function start () {
  var netClient = require('sint-bit-utils/utils/netClient')
  await sharedMethods.init(netClient)
  await methods.init(netClient)
  for (var i in methods)sharedMethods[i] = methods[i]
  var httpServer = require('sint-bit-jesus/servers/http')({methods: sharedMethods, config: CONFIG.http})
  var zeromqServer = require('sint-bit-jesus/servers/zeromq')({methods: sharedMethods, config: CONFIG.zeromq})
  await httpServer.start()
  await zeromqServer.start()
  return {
    netClient,
    httpServer,
    zeromqServer
  }
}

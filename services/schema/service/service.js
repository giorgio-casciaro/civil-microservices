
module.exports = async function service () {
  // BASE
  const CONFIG = require('./config')
  const getConsole = (serviceName, serviceId, pack) => require('sint-bit-utils/utils/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
  var PACKAGE = 'schemaMs'
  var CONSOLE = getConsole(PACKAGE, '----', '-----')

  // SERVICES DEPENDECIES
  const wait = require('sint-bit-utils/utils/wait')
  console.log('PREINIT SCHEMA')
  await wait.aerospike(CONFIG.aerospike)
  console.log('INIT SCHEMA')

  // EXPRESS
  const express = require('express')
  const app = express()
  var server = {}
  const bodyParser = require('body-parser')
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  // DB
  console.log('INIT SCHEMA')
  const kvDb = require('sint-bit-utils/utils/kvDb')
  var kvDbClient = await kvDb.getClient(CONFIG.aerospike)
  const loadSchema = async () => JSON.parse((await kvDb.get(kvDbClient, 'schema') || {}).schema || '{}')
  const saveSchema = async (specificSchema) => await kvDb.put(kvDbClient, 'schema', {schema: JSON.stringify(specificSchema || SCHEMA)})
  var SCHEMA = {}
  try { SCHEMA = await loadSchema() } catch (error) { await saveSchema() }
  console.log('SCHEMA', SCHEMA)

  // LIVE SIGNAL
  var liveSignals = {}
  var liveSignalTime = 1000 * 10
  async function checkLiveServices () {
    CONSOLE.log('checkLiveServices')
    var currentTime = Date.now()
    SCHEMA = await loadSchema()
    var serviceName
    for (serviceName in SCHEMA) {
      if (!liveSignals[serviceName]) {
        delete SCHEMA[serviceName]
        CONSOLE.log('service removed', serviceName)
        if (SCHEMA[serviceName])CONSOLE.log('error service not removed', SCHEMA[serviceName])
      }
    }
    for (serviceName in liveSignals) {
      if (liveSignals[serviceName] < currentTime - liveSignalTime) {
        delete SCHEMA[serviceName]
        CONSOLE.log('service removed', serviceName)
        if (SCHEMA[serviceName])CONSOLE.log('error service not removed', SCHEMA[serviceName])
      }
    }
    await saveSchema(SCHEMA)
  }
  setInterval(checkLiveServices, 1000)
  function liveSignal (service) {
    CONSOLE.log('liveSignal', service, Date.now())
    if (service) {
      liveSignals[service] = Date.now()
      if (!SCHEMA[service]) return {status: 2, msg: 'service not registered'}
      return {status: 1, msg: 'liveSignal updated'}
    }
    return {status: 0, msg: 'service not defined'}
  }
  // DOMAIN
  app.get('/getSchema', async function (req, res) {
    CONSOLE.log('getSchema', SCHEMA)
    res.setHeader('Content-Type', 'application/json')
    SCHEMA = await loadSchema()
    res.send(JSON.stringify(SCHEMA))
  })
  app.get('/getPublicMethodsSchema', async function (req, res) {
    SCHEMA = await loadSchema()
    var publicSchema = {}
    for (var serviceName in SCHEMA) {
      if (SCHEMA[serviceName].exportToPublicApi) {
        publicSchema[serviceName] = {}
        for (var methodName in SCHEMA[serviceName].methods) {
          if (SCHEMA[serviceName].methods[methodName].public) {
            publicSchema[serviceName][methodName] = SCHEMA[serviceName].methods[methodName].requestSchema
          }
        }
      }
    }
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(publicSchema))
  })
  app.get('/liveSignal', (req, res) => {
    var service = req.query.service
    res.send(liveSignal(service))
  })
  app.post('/setServiceSchema', async function (req, res) {
    CONSOLE.hl('setServiceSchema', req.body)
    SCHEMA = await loadSchema()
    SCHEMA[req.body.service] = JSON.parse(req.body.schema)
    liveSignal(req.body.service)
    await saveSchema()
    res.setHeader('Content-Type', 'application/json')
    res.send({success: 'schema received'})
  })
  app.post('/removeServiceSchema', async function (req, res) {
    try {
      CONSOLE.log('removeServiceSchema', req.body, SCHEMA)
      SCHEMA = await loadSchema()
      delete SCHEMA[req.body.service]
      CONSOLE.log('removeServiceSchema', req.body, SCHEMA)
      await saveSchema()
    } catch (error) {
      CONSOLE.log('setServiceSchema error', SCHEMA, error)
    }
    res.setHeader('Content-Type', 'application/json')
    res.send({success: 'schema removed'})
  })

  console.log('app.listen', CONFIG.httpPort)
  server.connection = app.listen(CONFIG.httpPort)

  return {
    CONFIG,
    app,
    server
  }
}

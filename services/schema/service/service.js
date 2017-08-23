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
  const saveSchema = async () => await kvDb.put(kvDbClient, 'schema', {schema: JSON.stringify(SCHEMA)})
  var SCHEMA = {}
  try { SCHEMA = await loadSchema() } catch (error) { await saveSchema() }
  console.log('SCHEMA', SCHEMA)

  // DOMAIN
  var lastControl = 0
  app.get('/getSchema', async function (req, res) {
    CONSOLE.log('getSchema', SCHEMA)
    res.setHeader('Content-Type', 'application/json')
  // if (lastControl > Date.now() - 60000) return res.send(JSON.stringify(SCHEMA))
    SCHEMA = await loadSchema()
    lastControl = Date.now()
  // fs.writeFileSync('/microservice/schema_json.log', JSON.stringify(SCHEMA))
    res.send(JSON.stringify(SCHEMA))
  })
  app.post('/setServiceSchema', async function (req, res) {
    CONSOLE.log('setServiceSchema', req.body)
    SCHEMA = await loadSchema()
    SCHEMA[req.body.service] = JSON.parse(req.body.schema)
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

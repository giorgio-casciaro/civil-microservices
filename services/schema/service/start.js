const Aerospike = require('aerospike')
const Key = Aerospike.Key
const kvDb = require('./lib/kvDb')

const getConsole = (serviceName, serviceId, pack) => require('./lib/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var PACKAGE = 'schemaMs'
var CONSOLE = getConsole(PACKAGE, '----', '-----')

const express = require('express')
const app = express()
var server = {}
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const CONFIG = require('./config')
var SCHEMA = {}
var lastControl = 0
var kvDbClient

var dbKey = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, 'schema')

const loadSchema = async () => JSON.parse((await kvDb.get(kvDbClient, dbKey)).schema) || {}
const saveSchema = async () => await kvDb.put(kvDbClient, dbKey, {schema: JSON.stringify(SCHEMA)})
app.get('/getSchema', async function (req, res) {
  CONSOLE.debug('getSchema')
  if (lastControl > Date.now() - 60000) return res.send(SCHEMA)
  SCHEMA = await loadSchema()
  lastControl = Date.now()
  res.setHeader('Content-Type', 'application/json')
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
kvDb.getClient(CONFIG.aerospike).then(async (client) => {
  kvDbClient = client
  try { await loadSchema() } catch (error) { SCHEMA = {}; await saveSchema() }
  console.log('app.listen', CONFIG.httpPort)
  server.connection = app.listen(CONFIG.httpPort)
})

module.exports = {
  CONFIG,
  app,
  server
}

process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var path = require('path')

const Aerospike = require('aerospike')
function getKvDbClient (config) {
  return new Promise((resolve, reject) => {
    Aerospike.connect(config, (error, client) => {
      if (error) return reject(error)
      resolve(client)
    })
  })
}
function getAerospikeClient (config) {
  return new Promise((resolve, reject) => {
    getKvDbClient(config).then((client) => {
      console.log('getAerospikeClient CONNECTED')
      resolve(client)
    }).catch((error) => {
      require('dns').lookup('aerospike', (err, address, family) => {
        console.log('address: %j family: IPv%s', address, family)
      })
      console.log('getAerospikeClient NOT CONNECTED')
      setTimeout(getAerospikeClient, 1000)
    })
  })
}
var getElasticsearchClient = async function (config) {
  var elasticsearch = require('elasticsearch')
  var configClone = Object.assign({}, config)
  var eClient = new elasticsearch.Client(configClone)
  var pingResponse = await eClient.ping({ requestTimeout: 10000 })
  console.log('Elasticsearch pingResponse ', pingResponse)
  return eClient
}

var startTest = async function () {
  var SERVICE = require('../start')
  var CONFIG = require('../config')
  CONFIG.console.debug = true

  CONFIG.aerospike.set = CONFIG.aerospike.set + '_testSet'
  CONFIG.aerospike.mutationsSet = CONFIG.aerospike.mutationsSet + '_testSet'
  CONFIG.aerospike.viewsSet = CONFIG.aerospike.viewsSet + '_testSet'

  var aerospikeClient = await getAerospikeClient(CONFIG.aerospike)
  aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.set, (err, result) => console.log)
  aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, (err, result) => console.log)
  aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.viewsSet, (err, result) => console.log)

  CONFIG.elasticsearch.index = CONFIG.elasticsearch.index + '-test-index'
  var elasticsearchClient = await getElasticsearchClient(CONFIG.elasticsearch)

  var methods = await require('../methods')(SERVICE.CONFIG.CONSOLE, SERVICE.netClient, CONFIG)

  var test = require('../lib/microTest')('test Microservice local methods and db conenctions')
  await new Promise((resolve) => setTimeout(resolve, 1000))

    // CREATE
  var createResponse = await methods.create({username: 'test_user', email: 'test@test.com', id: 'test'}, {})
  test(createResponse, { id: 'test' }, 'create 1 item')

    // READ
  var readResponse = await methods.read({id: 'test'})
  test(readResponse.username, 'test_user', 'read 1 item')

    // UPDATE
  await methods.update({id: 'test', username: 'test_user2'})
  var updateResponse = await methods.read({id: 'test'})
  test(updateResponse.username, 'test_user2', 'update 1 item')

    // DELETE
  await methods.remove({id: 'test'})
  var deleteResponse = await methods.read({id: 'test'})
  test(deleteResponse, {error: 'read error'}, 'remove 1 item')

    // // QUERY

  await methods.create({username: 'test_user1', email: 'test@test.com', id: 'test1'})
  await methods.create({username: 'test_user2', email: 'test@test.com', id: 'test2'})
  await new Promise((resolve) => setTimeout(resolve, 1000))
  var testTimestamp = Date.now()
  await methods.create({username: 'test_user3', email: 'test@test.com', id: 'test3'})
  await methods.create({username: 'test_user4', email: 'test@test.com', id: 'test4'})
  await methods.create({username: 'test_user5', email: 'test@test.com', id: 'test5'})

  var queryResponse = await methods.queryByTimestamp()
  test(queryResponse.length, 5, 'insert and query 5 items')

  var queryResponse = await methods.queryByTimestamp({from: testTimestamp, to: Date.now()})
  test(queryResponse.length, 3, 'query by timestamp')

  await methods.remove({id: 'test1'})
  await methods.remove({id: 'test2'})
  await methods.remove({id: 'test3'})
  await methods.remove({id: 'test4'})
  await methods.remove({id: 'test5'})

  var queryResponse = await methods.queryByTimestamp()
  test(queryResponse.length, 0, 'remove 5 items')

    // CREATE CQRS
  var createCqrsResponse = await methods.createCqrs({username: 'test_user', email: 'test@test.com', id: 'test'}, {})
  test(createCqrsResponse, { id: 'test' }, 'Cqrs create 1 item')

    // READ CQRS
  var readCqrsResponse = await methods.readCqrs({id: 'test'})
  test(readResponse.username, 'test_user', 'Cqrs read 1 item')

    // UPDATE CQRS
  await methods.updateCqrs({username: 'test_user2', id: 'test'}, {})
  var updateCqrsResponse = await methods.readCqrs({id: 'test'})
  test(updateResponse.username, 'test_user2', 'Cqrs update 1 item')

    // DELETE CQRS 
  await methods.removeCqrs({id: 'test'})
  var deleteCqrsResponse = await methods.readCqrs({id: 'test'})
  test(typeof deleteCqrsResponse.error, 'string', 'Cqrs remove and istant read 1 item')

    // CREATE VIEW
  var createViewResponse = await methods.createView({username: 'test_user', email: 'test@test.com', id: 'test'}, {})
  test(createViewResponse, { id: 'test' }, 'View create 1 item')

  await new Promise((resolve) => setTimeout(resolve, 1000))

    // READ VIEW
  var readViewResponse = await methods.readView({id: 'test'})
  test(readResponse.username, 'test_user', 'View read 1 item')

  await new Promise((resolve) => setTimeout(resolve, 1000))

    // UPDATE VIEW
  await methods.updateView({username: 'test_user2', id: 'test'}, {})
  var updateViewResponse = await methods.readView({id: 'test'})
  test(updateResponse.username, 'test_user2', 'View update 1 item')

  await new Promise((resolve) => setTimeout(resolve, 1000))

    // DELETE VIEW
  await methods.removeView({id: 'test'})
  await new Promise((resolve) => setTimeout(resolve, 1000))
  var deleteViewResponse = await methods.readView({id: 'test'})
  test(typeof deleteViewResponse, 'object', 'View remove 1 item')

  SERVICE.netServer.stop()
  SERVICE.schemaClient.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()

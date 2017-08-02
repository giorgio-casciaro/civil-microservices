process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var path = require('path')
var kvDb = require('../lib/kvDb')

const Aerospike = require('aerospike')
function getKvDbClient (config) {
  return new Promise((resolve, reject) => {
    try {
      Aerospike.connect(config, (error, client) => {
        if (error) return reject(error)
        resolve(client)
      })
    } catch (error) {
      reject(error)
    }
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

var startTest = async function () {
  await getAerospikeClient(require('../config').aerospike)
  var SERVICE = require('../start')
  var netClient = SERVICE.netClient
  await require('./base.test')(netClient)

  SERVICE.netServer.stop()
  // SERVICE.schemaClient.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()

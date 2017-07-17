const Aerospike = require('aerospike')
module.exports = {
  getClient (config) {
    return new Promise((resolve, reject) => {
      Aerospike.connect(config, (error, client) => {
        if (error) return reject(error)
        resolve(client)
      })
    })
  },
  put (kvDbClient, key, data, meta, policy = { exists: Aerospike.policy.exists.CREATE_OR_REPLACE }) {
    return new Promise((resolve, reject) => {
      kvDbClient.put(key, data, meta, policy, (error, result) => {
        if (error) return reject(error)
        resolve(result)
      })
    })
  },
  get (kvDbClient, key) {
    return new Promise((resolve, reject) => {
      kvDbClient.get(key, (error, result, meta) => {
        if (error) return reject(error)
        resolve({result, meta})
      })
    })
  },
  remove (kvDbClient, key) {
    return new Promise((resolve, reject) => {
      kvDbClient.remove(key, (error, key) => {
        if (error) return reject(error)
        resolve(key)
      })
    })
  },
  createIndex (kvDbClient, options) {
    return new Promise((resolve, reject) => {
      kvDbClient.createIndex(options, (error, job) => {
        if (error) return reject(error)
        job.waitUntilDone(function (error, result) {
          if (error) return reject(error)
          resolve(result)
        })
      })
    })
  },
  query (kvDbClient, namespace, set, modify = (query) => query) {
    return new Promise((resolve, reject) => {
      var query = kvDbClient.query(namespace, set)
      modify(query)
      var stream = query.foreach()
      var results = []
      stream.on('error', (error) => {
        console.error(error)
        throw error
      })
      stream.on('data', (record) => {
        results.push(record)
      })
      stream.on('end', () => {
        resolve(results)
      })
    })
  }
}

// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const cqrs = require('sint-bit-cqrs')
const path = require('path')

const uuid = require('uuid/v4')

const Aerospike = require('aerospike')
const Key = Aerospike.Key
var kvDb = require('./lib/kvDb')

console.log(kvDb)
var elasticsearch = require('elasticsearch')

// Connection URL
// Use connect method to connect to the Server

var service = async function getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  // var getMongo = () => toPromise(MongoClient.connect, [url], MongoClient)

  try {
    CONSOLE.log('CONFIG', CONFIG)
    var kvDbClient = await kvDb.getClient(CONFIG.aerospike)
    await kvDb.createIndex(kvDbClient, {
      ns: CONFIG.aerospike.namespace,
      set: CONFIG.aerospike.set,
      bin: '_updated',
      index: CONFIG.aerospike.set + '_idx_updated',
      datatype: Aerospike.indexDataType.NUMERIC
    })
    await kvDb.createIndex(kvDbClient, {
      ns: CONFIG.aerospike.namespace,
      set: CONFIG.aerospike.set,
      bin: '_created',
      index: CONFIG.aerospike.set + '_idx_created',
      datatype: Aerospike.indexDataType.NUMERIC
    })
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }

  var create = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.log('create', data, meta)
      if (!data.id)data.id = uuid()
      data._created = data._updated = Date.now()
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var result = await kvDb.put(kvDbClient, key, data, meta)
      CONSOLE.debug('create', result)
      return { id: result.key }
    } catch (error) {
      CONSOLE.error('create', error)
      return { error: 'create error' }
    }
  }
  var read = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      var result = await kvDb.get(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id))
      CONSOLE.debug('read', result)
      return result.result
    } catch (error) {
      // CONSOLE.error('read', error)
      return { error: 'read error' }
    }
  }
  var update = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var readResult = await kvDb.get(kvDbClient, key)
      CONSOLE.debug('readResult', readResult)
      var updatedData = Object.assign(readResult.result, data)
      var writeResult = await kvDb.put(kvDbClient, key, updatedData, readResult.meta)
      CONSOLE.debug('writeResult', writeResult)
      return { id: writeResult.key }
    } catch (error) {
      CONSOLE.error('update', error)
      return { error: 'update error' }
    }
  }
  var remove = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug('remove', CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var result = await kvDb.remove(kvDbClient, key)
      CONSOLE.debug('remove', key)
      return { id: data.id }
    } catch (error) {
      CONSOLE.error('remove', error)
      return { error: 'remove error' }
    }
  }
  var queryByTimestamp = async function (query = {from: 0, to: 100000000000000}, meta = {directCall: true}, getStream = null) {
    try {
      var result = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => {
        dbQuery.where(Aerospike.filter.range('_updated', query.from, query.to))
      })
      return result
    } catch (error) {
      CONSOLE.error('queryByTimestamp', error)
      return { error: 'remove error' }
    }
  }

  // CQRS

  // const getObjMutations = ({entityName, objId, minTimestamp = 0}) => getStorage().find({ collectionName: entityName + 'Mutations', query: { objId, timestamp: {$gte: minTimestamp} }, sort: {timestamp: 1} }) // ASYNC
  // const getLastSnapshot = ({entityName, objId}) => getStorage().find({collectionName: entityName + 'MainViewSnapshots', query: {objId: objId}, sort: {timestamp: 1}, limit: 1, start: 0})// ASYNC
  var mutationsCqrsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
  // var viewsCqrsPack = require('sint-bit-cqrs/views')({snapshotsMaxMutations: CONFIG.snapshotsMaxMutations })

  // const refreshViews = async function(args) {
  //   var results = await viewsCqrsPack.refreshViews(args)
  //   var views = []
  //   // results.forEach(({updatedView, newSnapshot}) => {
  //   //   if (updatedView) {
  //   //     views.push(updatedView)
  //   //     storageUpdate(entityCONFIG.viewsCollection, updatedView)
  //   //   }
  //   //   if (newSnapshot)storageInsert(entityCONFIG.snapshotsCollection, newSnapshot)
  //   // })
  //   return views
  // })
  const mutate = async function (args) {
    try {
      var mutation = mutationsCqrsPack.mutate(args)
      CONSOLE.debug('mutate', mutation)
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, mutation.id)
      await kvDb.put(kvDbClient, key, mutation)
      return mutation
    } catch (error) {
      CONSOLE.error('problems during create', error)
      return {error: 'problems during mutate'}
    }
  }
  const getState = async function (objId) {
    try {
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.viewsSet, objId)
      var state = await kvDb.get(kvDbClient, key)
      return {state, key}
    } catch (error) {
      CONSOLE.error('problems during getState', error)
      return {error: 'problems during getState'}
    }
  }

  var createCqrs = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`createCqrs`, {data, objId: data.id, mutation: 'create', meta})
      // CONSOLE.debug(`start createResource() corrid:` + meta.corrid, {data, meta})
      // await authorize({action: 'write.create', entityName: 'Resource', meta, data, id})

      data.id = data.id || uuid() // generate id if necessary

      var mutation = await mutate({data, objId: data.id, mutation: 'create', meta})
      CONSOLE.debug('createCqrs mutation', mutation)
      var newState = mutationsCqrsPack.applyMutations({}, [mutation])
      CONSOLE.debug('createCqrs newState', newState)
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.put(kvDbClient, key, newState).then(() => {})
      netClient.emit('viewCreated', newState, meta)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during createCqrs', error)
      return {error: 'problems during createCqrs'}
    }
  }

  var updateCqrs = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start updateCqrs() corrid:` + meta.corrid, {data, meta})
      // await authorize({action: 'write.create', entityName: 'Resource', meta, data, id})
      var mutation = await mutate({data, objId: data.id, mutation: 'update', meta})
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.get(kvDbClient, key).then((state) => {
        var newState = mutationsCqrsPack.applyMutations(state, [mutation])
        netClient.emit('viewCreated', newState, meta)
        kvDb.put(kvDbClient, key, newState)
      })
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during updateCqrs', error)
      return {error: 'problems during updateCqrs'}
    }
  }

  var readCqrs = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var view = await kvDb.get(kvDbClient, key)
      netClient.emit('viewReaded', { id: data.id}, meta)
      return view
    } catch (error) {
      // CONSOLE.warn('problems during readCqrs', error)
      return {error: 'problems during readCqrs'}
    }
  }
  var removeCqrs = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      var mutation = await mutate({data, objId: data.id, mutation: 'delete', meta})
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.remove(kvDbClient, key).then(() => {
        netClient.emit('viewRemoved', { id: data.id}, meta)
      })
      return { id: data.id }
    } catch (error) {
      CONSOLE.warn('problems during removeCqrs', error)
      return {error: 'problems during removeCqrs'}
    }
  }

  var elasticsearch = require('elasticsearch')
  var eClient = new elasticsearch.Client(Object.assign({}, CONFIG.elasticsearch))
  // var pingResponse = await eClient.ping({
  //   requestTimeout: 10000
  // })
  // t.same(pingResponse, true, 'elasticsearch ping')
  // var searchResponse = await eClient.search({
  //   q: 'test'
  // })
  //

  // EMIT
  var emit = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      return await netClient.emit('viewCreated', data.data, data.meta)
    } catch (error) {
      CONSOLE.warn('problems during emit', error)
      return {error: 'problems during emit'}
    }
  }
  // VIEW
  var createView = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start createView() corrid:` + meta.corrid, {data, meta})
      data.id = data.id || uuid() // generate id if necessary
      var response = await eClient.index({
        index: CONFIG.elasticsearch.index,
        type: CONFIG.elasticsearch.type,
        id: data.id,
        body: data
      })
      CONSOLE.debug('createView response', response)
      // netClient.emit('viewCreated', newState, meta)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during createView', error)
      return {error: 'problems during createView'}
    }
  }
  var readView = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start readView() corrid:` + meta.corrid, {data, meta})
      data.id = data.id || uuid() // generate id if necessary
      var response = await eClient.get({
        index: CONFIG.elasticsearch.index,
        type: CONFIG.elasticsearch.type,
        id: data.id
      })
      CONSOLE.debug('readView response', response)
      return response
    } catch (error) {
      // CONSOLE.warn('problems during readView', error)
      return {error: 'problems during readView'}
    }
  }
  var updateView = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start updateView() corrid:` + meta.corrid, {data, meta})
      data.id = data.id || uuid() // generate id if necessary
      var response = await eClient.update({
        index: CONFIG.elasticsearch.index,
        type: CONFIG.elasticsearch.type,
        id: data.id,
        body: {
          doc: data
        }
      })
      CONSOLE.debug('updateView response', response)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during updateView', error)
      return {error: 'problems during updateView'}
    }
  }
  var removeView = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start removeView() corrid:` + meta.corrid, {data, meta})
      data.id = data.id || uuid() // generate id if necessary
      var response = await eClient.delete({
        index: CONFIG.elasticsearch.index,
        type: CONFIG.elasticsearch.type,
        id: data.id
      })
      CONSOLE.debug('removeView response', response)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during removeView', error)
      return {error: 'problems during removeView'}
    }
  }

  return {
    emit,
    create, read, update, remove, queryByTimestamp,
    createCqrs, readCqrs, updateCqrs, removeCqrs,
    createView, readView, updateView, removeView,
    testNoResponse: async function (data, meta, getStream) {
      CONSOLE.debug('testNoResponse', {data, meta, getStream})
    },
    testAknowlegment: async function (data, meta, getStream) {
      CONSOLE.debug('testAknowlegment', {data, meta, getStream})
    },
    testResponse: async function (data, meta, getStream) {
      CONSOLE.debug('testResponse', {data, meta, getStream})
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return data
    },
    testStream: async function (data, meta, getStream) {
      CONSOLE.debug('testStream', {data, meta, getStream})
      var onClose = () => { CONSOLE.log('stream closed') }
      var stream = getStream(onClose, 120000)
      stream.write({testStreamConnnected: 1})
      setTimeout(() => stream.write(data), 500)
      setTimeout(() => stream.end(), 1000)
    }
  }
}

module.exports = service

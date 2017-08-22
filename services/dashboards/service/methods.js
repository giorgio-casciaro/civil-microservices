// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const path = require('path')
const uuid = require('uuid/v4')

const Aerospike = require('aerospike')
const Key = Aerospike.Key
const kvDb = require('sint-bit-utils/utils/kvDb')

const nodemailer = require('nodemailer')
const vm = require('vm')
const fs = require('fs')

const auth = require('sint-bit-utils/utils/auth')

var service = async function getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  try {
    CONSOLE.debug('CONFIG', CONFIG)
    CONSOLE.log('CONFIG', CONFIG)
    var kvDbClient = await kvDb.getClient(CONFIG.aerospike)
    // SMTP
    var smtpTrans = nodemailer.createTransport(require('./config').smtp)
    const getMailTemplate = async (template, sandbox = { title: 'title', header: 'header', body: 'body', footer: 'footer' }, ext = '.html') => {
      var populate = (content) => vm.runInNewContext('returnVar=`' + content.replace(new RegExp('`', 'g'), '\\`') + '`', sandbox)
      var result = await new Promise((resolve, reject) => fs.readFile(path.join(__dirname, '/emails/', template + ext), 'utf8', (err, data) => err ? reject(err) : resolve(populate(data))))
      return result
    }
    const sendMail = async (template = 'dashboardCreated', mailOptions, mailContents) => {
      mailOptions.html = await getMailTemplate(template, mailContents, '.html')
      mailOptions.txt = await getMailTemplate(template, mailContents, '.txt')
      CONSOLE.log('sendMail', mailOptions)
      if (!process.env.sendEmails) return true
      return await new Promise((resolve, reject) => smtpTrans.sendMail(mailOptions, (err, data) => err ? reject(err) : resolve(data)))
    }

    // MUTATIONS
    var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
    const mutate = async function (args) {
      try {
        var mutation = mutationsPack.mutate(args)
        CONSOLE.debug('mutate', mutation)
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, mutation.id)
        await kvDb.put(kvDbClient, key, mutation)
        return mutation
      } catch (error) {
        throw new Error('problems during mutate a ' + error)
      }
    }

    // INIT
    const init = async function () {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, 'dbInitStatus')
        await kvDb.put(kvDbClient, key, {version: 0, timestamp: Date.now()})
        var dbInitStatus = await kvDb.get(kvDbClient, key)
        if (!dbInitStatus) await kvDb.put(kvDbClient, key, {version: 0, timestamp: Date.now()})
        CONSOLE.log('dbInitStatus', dbInitStatus)
        if (dbInitStatus.version === 1) return true
        if (dbInitStatus.version < 1) {
        //   CONSOLE.log('dbInitStatus v1', dbInitStatus)
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'created', index: CONFIG.aerospike.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })

          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.DashUsersSet, bin: 'userId', index: CONFIG.aerospike.DashUsersSet + '_userId', datatype: Aerospike.indexDataType.STRING })
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.DashUsersSet, bin: 'dashId', index: CONFIG.aerospike.DashUsersSet + '_dashId', datatype: Aerospike.indexDataType.STRING })
        }
        await kvDb.put(kvDbClient, key, {version: 1, timestamp: Date.now()})
      } catch (error) {
        CONSOLE.log('problems during init', error)
        throw new Error('problems during init')
      }
    }

    const updateDashUserView = async function (id, mutations, isNew, set) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.DashUsersSet, id)
        var rawView = await getView(id, null, false) || {state: {}}
        var state = mutationsPack.applyMutations(rawView.state, mutations)
        var view = {
          updated: Date.now(),
          created: rawView.created || Date.now(),
          userId: state.userId,
          dashId: state.dashId,
          id: state.id,
          tags: state.tags || [],
          state: JSON.stringify(state)
        }
        await kvDb.put(kvDbClient, key, view)
        return view
      } catch (error) { throw new Error('problems during updateView ' + error) }
    }

    const getDashUserView = async function (id, view = null, stateOnly = true) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        if (!view) view = await kvDb.get(kvDbClient, key)
        if (!view) return null
        if (view.state)view.state = JSON.parse(view.state)
        if (stateOnly) return view.state
        return view
      } catch (error) { throw new Error('problems during getView ' + error) }
    }

    const updateView = async function (id, mutations, isNew, set) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, set || CONFIG.aerospike.set, id)
        var rawView = await getView(id, null, false) || {state: {}}
        var state = mutationsPack.applyMutations(rawView.state, mutations)
        var view = {
          updated: Date.now(),
          created: rawView.created || Date.now(),
          email: state.email || '',
          id: state.id,
          tags: state.tags || [],
          state: JSON.stringify(state)
        }
        await kvDb.put(kvDbClient, key, view)
        return view
      } catch (error) { throw new Error('problems during updateView ' + error) }
    }
    const getView = async function (id, view = null, stateOnly = true) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        if (!view) view = await kvDb.get(kvDbClient, key)
        if (!view) return null
        if (view.state)view.state = JSON.parse(view.state)
        if (stateOnly) return view.state
        return view
      } catch (error) { throw new Error('problems during getView ' + error) }
    }
    const addTag = async function (id, tag, meta) {
      var mutation = await mutate({data: tag, objId: id, mutation: 'addTag', meta})
      await updateView(id, [mutation])
    }
    const removeTag = async function (id, tag, meta) {
      var mutation = await mutate({data: tag, objId: id, mutation: 'removeTag', meta})
      await updateView(id, [mutation])
    }

    const getPicPath = (id, type = 'mini', format = 'jpeg') => path.join(CONFIG.uploadPath, `pic-${type}-${id}.${format}`)

    // const subscribe = async function (dashId, userId, type) {
    //   var id = dashId + userId
    //   var DashUser = {id, dashId, userId, type, created: Date.now()}
    //   // var token = await auth.createToken(id, permissions, meta, CONFIG.jwt)
    //   var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.DashUsersSet, id)
    //   await kvDb.put(kvDbClient, key, DashUser)
    //   return {success: `subscribed`}
    // }
    // const checkDashUser = async function (dashId, userId, type) {
    //   var id = dashId + userId
    //   var DashUser = {id, dashId, userId, type, created: Date.now()}
    //   var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.DashUsersSet, id)
    //   var DashUser = await kvDb.get(kvDbClient, key)
    //   if (DashUser && DashUser.type === type) return true
    //   return false
    // }

    await init()

    return {
      async getPermissions (reqData, meta = {directCall: true}, getStream = null) {
        // recuperare iscrizioni
        return { permissions: [ [10, 'dashboard.create', 1], [10, 'dashboard.read', 1] ] }
      },
      async create (reqData, meta = {directCall: true}, getStream = null) {
        var id = uuid()
        reqData.id = id
        await auth.userCan('dashboard.create', meta, CONFIG.jwt)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'create', meta})
        await updateView(id, [mutation], true)
        var userId = auth.getUserIdFromToken(meta, CONFIG.jwt)
        await subscribe(id, userId, 'admin')
        return {success: `Dashboard created`, id}
      },
      async read (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('dashboard.read', meta, CONFIG.jwt)
        var currentState = await getView(id)
        if (!currentState || currentState.tags.indexOf('removed') >= 0) {
          throw new Error('dashboard not active')
        }
        return currentState
      },
      async update (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var userId = getUserIdFromToken(meta)
        // checkDashUser(id, userId, 'admin')
        // await auth.userCan('dashboard.' + id + '.write', meta, CONFIG.jwt)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'update', meta})
        await updateView(id, [mutation])
        return {success: `Dashboard updated`}
      },
      async setRole (reqData, meta = {directCall: true}, getStream = null) {
      },
      async getRole (reqData, meta = {directCall: true}, getStream = null) {
      },
      // async subscribe (reqData, meta = {directCall: true}, getStream = null) {
      //   var userId = getUserIdFromToken(meta)
      //   return await subscribe(reqData.dashId, userId, 'basic')
      // },
      // async unsubscribe (reqData, meta = {directCall: true}, getStream = null) {
      //   var id = reqData.dashId + reqData.userId
      //   var userId = getUserIdFromToken(meta)
      //   // checkDashUser(id, userId, 'user')
      //   var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.DashUsersSet, id)
      //   var rawResults = await kvDb.remove(kvDbClient, key)
      //   return {success: `unsubscribed`}
      // },
      async readPrivate (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var userId = getUserIdFromToken(meta)
        // checkDashUser(id, userId)
        var currentState = await getView(id)
        if (!currentState) throw new Error('dashboard not active')
        return currentState
      },
      async remove (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var userId = getUserIdFromToken(meta)
        // checkDashUser(id, userId, 'admin')
        // await auth.userCan('dashboard.' + id + '.write.' + id, meta, CONFIG.jwt)
        await addTag(id, 'removed', meta)
        return {success: `Dashboard removed`}
      },
      async updatePic (reqData, meta = {directCall: true}, getStream = null) {
        var sharp = require('sharp')
        var unlink = (file) => new Promise((resolve, reject) => fs.unlink(file, (err, data) => err ? resolve(err) : resolve(data)))
        var id = reqData.id
        try {
          // await auth.userCan('dashboard.' + id + '.write', meta, CONFIG.jwt)
        } catch (error) {
          await unlink(reqData.pic.path)
          throw error
        }
        // RESIZE
        var picNewPathFullSize = getPicPath(reqData.id, 'full')
        var picNewPathMini = getPicPath(reqData.id, 'mini')
        var baseImg = sharp(reqData.pic.path).resize(1000, 1000).max()
        await new Promise((resolve, reject) => baseImg.toFile(picNewPathFullSize, (err, data) => err ? reject(err) : resolve(data)))
        await new Promise((resolve, reject) => baseImg.resize(100, 100).crop().toFile(picNewPathMini, (err, data) => err ? reject(err) : resolve(data)))

        // SAVE FILE IN DB
        const saveFileInDb = (file, id = uuid()) => new Promise((resolve, reject) => {
          const XXHash = require('xxhash')
          var chunkSize = 1024 * 128
          var chunkIt = fs.statSync(file).size > chunkSize
          CONSOLE.log('saveFileInDb', chunkIt, chunkSize)
          var stream = fs.createReadStream(file)
          var chunks = []
          stream.on('data', async function (chunk) {
            try {
              var chunkId = XXHash.hash(chunk, 0xCAFEBABE)

              var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.filesChunksSet, chunkId)
              CONSOLE.log('chunk', chunkId, {chunk})
              if (chunkIt) {
                chunks.push(chunkId)
                await kvDb.put(kvDbClient, key, {chunk})
              } else {
                chunks = chunk
              }
            } catch (error) {
              reject(error)
            }
          })
          stream.on('end', async function () {
            try {
              CONSOLE.log('end')
              var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.filesSet, id)
              var dbFile = {id, chunks}
              CONSOLE.log('end', id, dbFile)
              await kvDb.put(kvDbClient, key, dbFile)
            } catch (error) {
              reject(error)
            }
            resolve({id, chunks})
          })
        })

        var fullSize = await saveFileInDb(picNewPathFullSize, reqData.id + '_profile_full')
        var mini = await saveFileInDb(picNewPathMini, reqData.id + '_profile_mini')

        // CLEAR TEMP FILES
        unlink(reqData.pic.path)
        unlink(picNewPathFullSize)
        unlink(picNewPathMini)

        // UPDATE DB
        // var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePic', meta})
        // await updateView(id, [mutation])
        return {success: `Pic updated`}
      },
      async getPic (reqData, meta = {directCall: true}, getStream = null) {
        const readFileInDb = async (id) => {
          var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.filesSet, id)
          var dbFile = await kvDb.get(kvDbClient, key)

          if (dbFile && dbFile.chunks) {
            CONSOLE.log('dbFile', dbFile)
            if (dbFile.chunks instanceof Buffer) return dbFile.chunks // SINGLE CHUNK
            var chunksPromises = dbFile.chunks.map((chunkId) => kvDb.get(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.filesChunksSet, chunkId)))
            var allChunks = await Promise.all(chunksPromises)
            var complete = allChunks.reduce((a, b) => Buffer.concat([a, b.chunk]), Buffer.alloc(0))
            CONSOLE.log('complete', complete)
            return complete
          }
          return null
        }
        try {
          return await readFileInDb(reqData.id + '_profile_mini')
        } catch (error) {
          return null
        }
      },
      async createDashUser (reqData, meta = {directCall: true}, getStream = null) {
        var id = uuid()
        reqData.id = id
        // await auth.userCan('dashboard.create', meta, CONFIG.jwt)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'create', meta})
        await updateView(id, [mutation], true)
        var userId = auth.getUserIdFromToken(meta, CONFIG.jwt)
        await subscribe(id, userId, 'admin')
        return {success: `Dashboard created`, id}
      },
      async readDashUser (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        // await auth.userCan('dashboard.read', meta, CONFIG.jwt)
        var currentState = await getView(id)
        if (!currentState || currentState.tags.indexOf('removed') >= 0) {
          throw new Error('dashboard not active')
        }
        return currentState
      },
      async updateDashUser (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var userId = getUserIdFromToken(meta)
        // checkDashUser(id, userId, 'admin')
        // await auth.userCan('dashboard.' + id + '.write', meta, CONFIG.jwt)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'update', meta})
        await updateView(id, [mutation])
        return {success: `Dashboard updated`}
      },
      async queryByTimestamp (query = {}, meta = {directCall: true}, getStream = null) {
        // await auth.userCan('dashboard.read.query', meta, CONFIG.jwt)
        query = Object.assign({from: 0, to: 100000000000000}, query)
        var rawResults = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => { dbQuery.where(Aerospike.filter.range('updated', query.from, query.to)) })
        var results = await Promise.all(rawResults.map((result) => getView(result.id, result)))
        return results
      },
      async test (query = {}, meta = {directCall: true}, getStream = null) {
        var results = await require('./tests/base.test')(netClient)
        CONSOLE.log('test results', results)
        return results
      }
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service

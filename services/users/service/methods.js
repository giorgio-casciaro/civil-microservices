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
const kvDb = require('./lib/kvDb')

const nodemailer = require('nodemailer')
const vm = require('vm')
const fs = require('fs')

const auth = require('./lib/auth')
const ErrorWithData = require('./lib/ErrorWithData')

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
    const sendMail = async (template = 'userCreated', mailOptions, mailContents) => {
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
        throw new Error('problems during mutate ' + error)
      }
    }
    // INIT
    const init = async function () {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, 'dbInitStatus')
        var dbInitStatus = await kvDb.get(kvDbClient, key)
        if (!dbInitStatus) await kvDb.put(kvDbClient, key, {version: 0, timestamp: Date.now()})
        CONSOLE.log('dbInitStatus', dbInitStatus)
        if (dbInitStatus.version === 1) return true
        if (dbInitStatus.version < 1) {
          CONSOLE.log('dbInitStatus v1', dbInitStatus)
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'email', index: CONFIG.aerospike.set + '_email', datatype: Aerospike.indexDataType.STRING })
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'updated', index: CONFIG.aerospike.set + '_updated', datatype: Aerospike.indexDataType.NUMERIC })
          await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'created', index: CONFIG.aerospike.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })
        }
        await kvDb.put(kvDbClient, key, {version: 1, timestamp: Date.now()})
      } catch (error) { throw new Error('problems during init') }
    }
    // VIEWS
    // const updateRawView = async function (view) {
    //   try {
    //     var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, view.id)
    //     await kvDb.put(kvDbClient, key, view)
    //     return view
    //   } catch (error) { throw new Error('problems during updateRawView ' + error) }
    // }
    const updateView = async function (id, mutations, isNew) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
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
    const getUserByMail = async function (email) {
      try {
        var result = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => {
          dbQuery.where(Aerospike.filter.equal('email', email))
        })
        if (!result[0]) return null
        return await getView(result[0].id, result[0])
      } catch (error) { throw new Error('problems during getUserByMail ' + error) }
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
    await init()

    return {
      async getPermissions (reqData, meta = {directCall: true}, getStream = null) {
        return { permissions: [ [10, 'user.' + reqData.id + '.*', 1], [5, 'user.*.read', 1] ] }
      },
      async create (reqData, meta = {directCall: true}, getStream = null) {
        var mailExists = await getUserByMail(reqData.email)
        if (mailExists) throw new Error('User exists')
        var id = uuid()
        reqData.id = id
        reqData.emailConfirmationCode = uuid()
        var mutation = await mutate({data: reqData, objId: id, mutation: 'create', meta})
        await sendMail('userCreated', {to: reqData.email, from: CONFIG.mailFrom, subject: 'Benvenuto in CivilConnect - conferma la mail'}, Object.assign({CONFIG}, reqData))
        await updateView(id, [mutation], true)
        return {success: `User created`, id, email: reqData.email}
      },
      async readEmailConfirmationCode (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getView(id)
        return {emailConfirmationCode: currentState.emailConfirmationCode}
      },
      async confirmEmail (reqData, meta = {directCall: true}, getStream = null) {
        var currentState = await getUserByMail(reqData.email, [0])
        if (!currentState) throw new Error('email is confirmed or user is not registered')
        if (currentState.emailConfirmationCode !== reqData.emailConfirmationCode) throw new Error('email confirmation code not valid')
        var id = currentState.id
        // var mutation = await mutate({ data: {}, objId: id, mutation: 'confirmEmail', meta })
        // await updateView(id, [mutation])
        await addTag(id, 'emailConfirmed', meta)
        return {success: `Email confirmed`, email: reqData.email}
      },
      async read (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('user.' + id + '.read', meta, CONFIG.jwt)
        var currentState = await getView(id)
        if (!currentState || currentState.tags.indexOf('removed') >= 0 || currentState.tags.indexOf('emailConfirmed') < 0 || currentState.tags.indexOf('passwordAssigned') < 0) {
          throw new Error('user not active')
        }
        return currentState
      },
      async readPrivate (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('user.' + id + '.private.read', meta, CONFIG.jwt)
        var currentState = await getView(id)
        if (!currentState) throw new Error('user not active')
        return currentState
      },
      async updatePublicName (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('user.' + id + '.write', meta, CONFIG.jwt)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePublicName', meta})
        await updateView(id, [mutation])
        return {success: `Public Name updated`}
      },
      // async updatePic (reqData, meta = {directCall: true}, getStream = null) {
      //   var sharp = require('sharp')
      //   var unlink = (file) => new Promise((resolve, reject) => fs.unlink(file, (err, data) => err ? resolve(err) : resolve(data)))
      //   var id = reqData.id
      //   try {
      //     await auth.userCan('user.' + id + '.write', meta, CONFIG.jwt)
      //   } catch (error) {
      //     await unlink(reqData.pic.path)
      //     throw error
      //   }
      //   var picNewPathMini = getPicPath(reqData.id, 'mini')
      //   var picNewPathMiniCrop = getPicPath(reqData.id, 'minicrop')
      //   var tempFile = reqData.pic.path + 'temp'
      //   fs.renameSync(reqData.pic.path, tempFile)
      //   var baseImg = sharp(tempFile).resize(500, 500).max()
      //   await new Promise((resolve, reject) => baseImg.toFile(reqData.pic.path, (err, data) => err ? reject(err) : resolve(data)))
      //   await new Promise((resolve, reject) => baseImg.resize(100, 100).crop().toFile(picNewPathMiniCrop, (err, data) => err ? reject(err) : resolve(data)))
      //   await new Promise((resolve, reject) => baseImg.resize(100, 100).max().toFile(picNewPathMini, (err, data) => err ? reject(err) : resolve(data)))
      //   unlink(tempFile)
      //   var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePic', meta})
      //   await updateView(id, [mutation])
      //   return {success: `Pic updated`}
      // },
      // async getPic (reqData, meta = {directCall: true}, getStream = null) {
      //   var picNewPath = getPicPath(reqData.id, 'minicrop')
      //   try {
      //     var pic = await new Promise((resolve, reject) => fs.readFile(picNewPath, (err, data) => err ? reject(err) : resolve(data)))
      //   } catch (error) {
      //     return null
      //   }
      //   return pic
      // },
      async updatePic (reqData, meta = {directCall: true}, getStream = null) {
        var sharp = require('sharp')
        var unlink = (file) => new Promise((resolve, reject) => fs.unlink(file, (err, data) => err ? resolve(err) : resolve(data)))
        var id = reqData.id
        try {
          await auth.userCan('user.' + id + '.write', meta, CONFIG.jwt)
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
      async updatePassword (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('user.' + id + '.private.write', meta, CONFIG.jwt)
        if (reqData.password !== reqData.confirmPassword) throw new Error('Confirm Password not equal')
        var currentState = await getView(id)
        if (!currentState || currentState.tags.indexOf('removed') >= 0 || currentState.tags.indexOf('emailConfirmed') < 0 || currentState.tags.indexOf('passwordAssigned') < 0) {
          throw new Error('user not active')
        }
        var bcrypt = require('bcrypt')
        if (currentState.password && !bcrypt.compareSync(reqData.oldPassword, currentState.password)) throw new Error('Old Password not valid')
        var data = {password: bcrypt.hashSync(reqData.password, 10)}
        var mutation = await mutate({data, objId: id, mutation: 'updatePassword', meta})
        await updateView(id, [mutation])
        return {success: `Password updated`}
      },
      async assignPassword (reqData, meta = {directCall: true}, getStream = null) {
        if (reqData.password !== reqData.confirmPassword) throw new Error('Confirm Password not equal')
        var currentState = await getUserByMail(reqData.email, [1])
        if (!currentState || currentState.tags.indexOf('removed') >= 0 || currentState.tags.indexOf('passwordAssigned') >= 0 || currentState.tags.indexOf('emailConfirmed') < 0) {
          throw new Error('user not active')
        }
        var id = currentState.id
        var data = {password: require('bcrypt').hashSync(reqData.password, 10)}
        var mutation = await mutate({data, objId: id, mutation: 'assignPassword', meta})
        await updateView(id, [mutation])
        await addTag(id, 'passwordAssigned', meta)
        return {success: `Password assigned`}
      },
      async login (reqData, meta = {directCall: true}, getStream = null) {
        var bcrypt = require('bcrypt')
        var currentState = await getUserByMail(reqData.email)
        if (!currentState || currentState.tags.indexOf('removed') >= 0 || currentState.tags.indexOf('passwordAssigned') < 0 || currentState.tags.indexOf('emailConfirmed') < 0) {
          throw new Error('Wrong username or password')
        }
        if (!bcrypt.compareSync(reqData.password, currentState.password)) throw new Error('Wrong username or password')
        delete reqData.password
        var id = currentState.id
        var permissions = await netClient.emit('getPermissions', {id}, meta)
        var token = await auth.createToken(permissions, meta, CONFIG.jwt)
        var mutation = await mutate({data: {token}, objId: id, mutation: 'login', meta})
        updateView(id, [mutation])
        delete currentState.password
        return { success: `Login`, token, currentState }
      },
      async logout (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getView(id)
        if (!currentState || currentState.tags.indexOf('removed') >= 0 || currentState.tags.indexOf('passwordAssigned') < 0 || currentState.tags.indexOf('emailConfirmed') < 0) {
          throw new Error('user not active')
        }
        if (currentState.email !== reqData.email) throw new Error('Problems durig logout')
        return {success: `Logout`, id, email: reqData.email}
      },
      async updatePersonalInfo (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('user.' + id + '.write', meta, CONFIG.jwt)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePersonalInfo', meta})
        await updateView(id, [mutation])
        return {success: `Personal Info updated`}
      },
      async readPersonalInfo (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('user.' + id + '.write', meta, CONFIG.jwt)
        var currentState = await getView(id)
        if (!currentState || currentState.tags.indexOf('removed') >= 0 || currentState.tags.indexOf('passwordAssigned') < 0 || currentState.tags.indexOf('emailConfirmed') < 0) {
          throw new Error('user not active')
        }
        return currentState
      },
      async remove (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await auth.userCan('user.' + id + '.write.' + id, meta, CONFIG.jwt)
        await addTag(id, 'removed', meta)
        return {success: `User removed`}
      },
      async queryByTimestamp (query = {}, meta = {directCall: true}, getStream = null) {
        await auth.userCan('user.read.query', meta, CONFIG.jwt)
        query = Object.assign({from: 0, to: 100000000000000}, query)
        var rawResults = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => { dbQuery.where(Aerospike.filter.range('updated', query.from, query.to)) })
        var results = await Promise.all(rawResults.map((result) => getView(result.id, result)))
        return results
      }
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service

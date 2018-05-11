// const Aerospike = require('aerospike')
// const Key = Aerospike.Key
// const kvDb = require('./lib/kvDb')
const fs = require('fs')
const path = require('path')

const getConsole = (serviceName, serviceId, pack) => require('./lib/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var PACKAGE = 'deployMs'
var CONSOLE = getConsole(PACKAGE, '----', '-----')

const express = require('express')
const app = express()
var server = {}
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '/public')))
const CONFIG = require('./config')

const yaml = require('js-yaml')

const exec = require('child_process').execSync
const hashFiles = require('hash-files')

const srvPath = (service) => path.join(CONFIG.mountPath, service)
const srvPathFile = (service, file) => path.join(CONFIG.mountPath, service, '/', file)
const isFile = file => fs.existsSync(file) && fs.lstatSync(file).isFile()
const isDirectory = file => fs.existsSync(file) && fs.lstatSync(file).isDirectory()
const getDirectories = (srcpath) => fs.readdirSync(srcpath).filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory())
const getFiles = (srcpath) => fs.readdirSync(srcpath).filter(file => isFile(path.join(srcpath, file)))
const getHash = srv => hashFiles.sync({'files': [srvPath(srv) + '/service/**', srvPath(srv) + '/kubernetes/**']})

function getServiceInfo (service) {
  var hash = getHash(service)
  var saved = getServiceData(service)
  return {
    dir: service,
    path: srvPath(service),
    saved,
    haveUpdates: !(saved && saved.hash === hash),
    node_modules: isDirectory(srvPathFile(service, 'node_modules')),
    node_modules_compiled: isDirectory(srvPathFile(service, 'node_modules_compiled'))
  }
}
async function getServicesInfo () {
  return getDirectories(CONFIG.mountPath)
  .filter(service => isFile(srvPathFile(service, '/service.name')))
  .map(getServiceInfo)
}
const updServiceData = (srv, info) => {
  info.hash = getHash(srv)
  info.version = parseInt(info.version || 0) + 1
  fs.writeFileSync(srvPathFile(srv, '/service.hash'), info.hash, 'utf-8')
  fs.writeFileSync(srvPathFile(srv, '/service.version'), info.version, 'utf-8')
}
const getServiceData = (srv) => {
  return {
    name: fs.readFileSync(srvPathFile(srv, '/service.name'), 'utf-8'),
    hash: isFile(srvPathFile(srv, '/service.hash')) ? fs.readFileSync(srvPathFile(srv, '/service.hash'), 'utf-8').trim() : '',
    version: isFile(srvPathFile(srv, '/service.version')) ? fs.readFileSync(srvPathFile(srv, '/service.version'), 'utf-8').trim() : 0,
    image: isFile(srvPathFile(srv, '/service.image')) ? fs.readFileSync(srvPathFile(srv, '/service.image'), 'utf-8').trim() : false
  }
}
const updateYaml = (srv, file, image, version) => {
  if (image && isFile(srvPathFile(srv, file))) {
    var kubeYaml = yaml.safeLoad(fs.readFileSync(srvPathFile(srv, file), 'utf8'))
    kubeYaml.spec.template.spec.containers[0].image = `${image}:version-${version}`
    fs.writeFileSync(srvPathFile(srv, file), yaml.safeDump(kubeYaml), 'utf8')
    return true
  }
  return false
}
function install (srv) {
  var serviceInfo = getServiceInfo(srv)
  var out = {}
  console.log(`Installing ${serviceInfo.saved.name}`, serviceInfo)
  if (isFile(srvPathFile(srv, 'install.sh'))) {
    try {
      out.out = exec('sh install.sh', {cwd: serviceInfo.path, encoding: 'utf-8', timeout: 1000 * 60 * 60})
    } catch (error) {
      out.errors = error
    }
  }
  return out
}
function compile (srv) {
  var serviceInfo = getServiceInfo(srv)
  console.log(`Compiling ${serviceInfo.saved.name}`, serviceInfo)
  var out = {}
  if (isFile(srvPathFile(srv, 'compile.sh'))) {
    try {
      out.out = exec('sh compile.sh', {cwd: serviceInfo.path, encoding: 'utf-8', timeout: 1000 * 60 * 60})
    } catch (error) {
      out.errors = error
    }
  }
  return out
}
function build (srv) {
  var serviceInfo = getServiceInfo(srv)
  var out = {}
  console.log(`Building ${serviceInfo.saved.name}`)
  if (isFile(srvPathFile(srv, 'build.sh'))) {
    try {
      out.out = exec('sh build.sh', {cwd: serviceInfo.path, encoding: 'utf-8', timeout: 1000 * 60 * 60})
    } catch (error) {
      out.errors = error
    }
  }
  return out
}
function push (srv) {
  var serviceInfo = getServiceInfo(srv)
  var out = {}
  console.log(`Pushing ${serviceInfo.saved.name}`)
  if (isFile(srvPathFile(srv, 'push.sh'))) {
    try {
      out.out = exec('sh push.sh', {cwd: serviceInfo.path, encoding: 'utf-8', timeout: 1000 * 60 * 60})
    } catch (error) {
      out.errors = error
    }
  }
  return out
}

function updateVersion (srv) {
  var out = {}
  try {
    var serviceInfo = getServiceInfo(srv)
    console.log(`Kubernetes update`)
    out.deployment = updateYaml(srv, '/kubernetes/deployment.yaml', serviceInfo.saved.image, serviceInfo.saved.version)
    out.statefulSet = updateYaml(srv, '/kubernetes/statefulSet.yaml', serviceInfo.saved.image, serviceInfo.saved.version)
    console.log('serviceInfo.saved', serviceInfo.saved)
    updServiceData(srv, serviceInfo.saved)
  } catch (error) {
    out.error = error.message || error
  }
  return out
}

app.get('/analizeDev', async function (req, res) {
  try {
    var response = { services: await getServicesInfo() }
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})

app.get('/compileService', async function (req, res) {
  try {
    var response = {'success': 'service compiled', 'install': install(req.query.service), 'compile': compile(req.query.service)}
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})

app.get('/publishService', async function (req, res) {
  try {
    var info = await getServiceInfo(req.query.service)
    var response = {}
    if (!info.haveUpdates && !req.query.force)response = {'success': 'service not need to publish'}
    else response = {'success': 'service published', 'install': install(req.query.service), 'compile': compile(req.query.service), 'build': build(req.query.service), 'push': push(req.query.service), 'updateVersion': updateVersion(req.query.service)}
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})

app.get('/getUpdatedKubernetesYaml', async function (req, res) {
  try {
    var response = {}
    var srv = req.query.service
    if (isFile(srvPathFile(srv, '/kubernetes/deployment.yaml'))) {
      response.deployment = fs.readFileSync(srvPathFile(srv, '/kubernetes/deployment.yaml'), 'utf8')
    }
    if (isFile(srvPathFile(srv, '/kubernetes/statefulSet.yaml'))) {
      response.statefulSet = fs.readFileSync(srvPathFile(srv, '/kubernetes/statefulSet.yaml'), 'utf8')
    }
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})
app.get('/getAllKubernetesYaml', async function (req, res) {
  try {
    var srv = req.query.service
    var files = getFiles(srvPathFile(srv, '/kubernetes/'))
    console.log(files)
    var response = { }
    files.forEach(file => { response[file] = fs.readFileSync(srvPathFile(srv, '/kubernetes/' + file), 'utf8') })
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})

server.connection = app.listen(CONFIG.httpPort)
module.exports = {
  CONFIG,
  app,
  server
}

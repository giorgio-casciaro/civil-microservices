const CONFIG = {
  kubernetesToken: process.env.kubernetesToken || 'your kubeadm token',
  apiUrl: process.env.apiUrl || 'https://192.168.33.100:6443',
  elasticsearchHost: process.env.elasticsearchHost || '192.168.33.100:81',
  updateEveryMsec: process.env.updateEveryMsec || 1000,
  sendQueueEveryMsec: process.env.sendQueueEveryMsec || 1000
}

var K8s = require('k8s')
var cache = require('memory-cache')
var fs = require('fs')
var logTypes = require('./config/logTypes')
var nodeGrok = require('node-grok')
var patterns = nodeGrok.loadDefaultSync()
// patterns.loadSync('grokPatterns')
var elasticsearch = require('elasticsearch')
var elasticsearchClient = new elasticsearch.Client({
  host: CONFIG.elasticsearchHost,
  log: 'error'
})
var kubeapi = K8s.api({
  'auth': {
    'token': process.env.kubernetesToken || 'b6bc83b6a136e3cf'
  },
  strictSSL: false,
  endpoint: CONFIG.apiUrl,
  version: '/api/v1'
})
console.log(kubeapi)

var logs = []

async function outputQueue () {
  try {
    if (logs && logs.length) {
      var sendLogs = logs
      logs = []
      console.log(`outputQueue SENDING --> ${sendLogs.length} LOGS`)
      await elasticsearchClient.bulk({ body: sendLogs, index: 'logme-logs', type: 'log' })
      console.log(`outputQueue SENT --> ${sendLogs.length} LOGS`)
    } else console.log('outputQueue --> NO LOG')
  } catch (error) {
    console.error('outputQueue', error)
  }
}

function addToQueue (log) {
  logs.push({ index: { } })
  logs.push(log)
}

function startQueueLoop () {
  setInterval(outputQueue, CONFIG.sendQueueEveryMsec)
}

// LOG PARSE - parse and filter a single log
function parseLogsBasedOnPodPatterns (singleLog, podPatterns) {
  console.log('parseLogsBasedOnPodPatterns', singleLog, podPatterns[0])
  if (podPatterns[0]) {
    var pattern = cache.get(podPatterns[0])
    if (pattern === null && logTypes[podPatterns[0]]) pattern = cache.put(podPatterns[0], patterns.createPattern(logTypes[podPatterns[0]].grok), 5000)
    if (pattern !== null) {
      pattern.parse(singleLog, function (err, obj) {
        if (err)console.error('parseLogsBasedOnPodPatterns', err)
        if (!obj) return parseLogsBasedOnPodPatterns(singleLog, podPatterns.slice(1))
        if (logTypes[podPatterns[0]].filter)obj = logTypes[podPatterns[0]].filter(obj)
        addToQueue(obj)
      })
    } else {
      parseLogsBasedOnPodPatterns(singleLog, podPatterns.slice(1))
    }
  }
}
// LOGS SPLIT - parse multiline logs
function parseLogs (logString, pod) {
  console.log('parseLogs', logString)
  var podPatterns = pod.metadata.labels.logMe.split('_')
  // console.log('parseLogs', logString.split('\n'))
  var logs = logString.split('\n')
  logs.forEach((singleLog) => {
    console.log('singleLog', singleLog)
    parseLogsBasedOnPodPatterns(singleLog, podPatterns)
  })
}

// LOGS GET FROM KUBEAPI - request pods from kubeapi based on label logMe and loop on pod's containers for logs
function parsePodsLogs (fromTimestamp = 0, labelSelector = 'logMe') {
  kubeapi.get(`pods/?labelSelector=${labelSelector}`, function (err, data) {
    if (err)console.error('parsePodsLogs', err)
    if (!data.items) return console.log('parsePodsLogs --> NO LOG')
    data.items.forEach((pod) => {
      pod.spec.containers.forEach((container) => {
        kubeapi.log(`namespaces/${pod.metadata.namespace}/pods/${pod.metadata.name}/log?container=${container.name}&sinceTime=${fromTimestamp}`, function (err, data) {
          if (!err && data !== '') {
            console.log(`parsePodsLogs --> ${pod.metadata.name} ${container.name} HAVE LOGS ${data.length}`)
            parseLogs(data, pod)
          } else console.log(`parsePodsLogs --> ${pod.metadata.name} ${container.name} NO LOG`)
        })
      })
    })
  })
}

async function getLastTimestamp () {
  try {
    var settings = await elasticsearchClient.get({ id: 'settings', index: 'logme-logs', type: 'settings' })
    if (!settings)settings = {timestamp: 0}
    console.log(`getLastTimestamp`, settings)
    return settings.timestamp
  } catch (error) {
    console.error(`getLastTimestamp`, settings)
    return 0
  }
}
async function setLastTimestamp (timestamp) {
  await elasticsearchClient.update({
    id: 'settings',
    index: 'logme-logs',
    type: 'settings',
    body: {
      doc: {
        timestamp
      },
      upsert: {
        timestamp
      }
    }
  })
}

async function parseCicle () {
  var tempTimestamp = new Date().toISOString()
  await parsePodsLogs(await getLastTimestamp())
  await setLastTimestamp(tempTimestamp)
}

function startParseLoop () {
  console.log('startParseLoop')
  setInterval(parseCicle, CONFIG.updateEveryMsec)
}

startParseLoop()
startQueueLoop()

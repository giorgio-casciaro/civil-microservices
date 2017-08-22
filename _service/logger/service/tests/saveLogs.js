var K8s = require('k8s')
var jsonfile = require('jsonfile')
var fs = require('fs')
var kubeapi = K8s.api({
  endpoint: 'http://192.168.33.100:8001',
  version: '/api/v1'
})

function podLogs (pod) {
  console.log('podLogs', pod.metadata.namespace, pod.metadata.labels, pod.metadata.name)
  // jsonfile.writeFileSync(`pods/${pod.metadata.name}.json`, pod)
  for (var container of pod.spec.containers)containerLogs(pod.metadata.namespace, pod.metadata.name, container)
}

function containerLogs (namespaceName, podName, container) {
  var urlRequest = `namespaces/${namespaceName}/pods/${podName}/log?container=${container.name}`
  console.log('containerLogs', urlRequest, namespaceName, podName, container.name)
  try {
    kubeapi.log(urlRequest, function (err, data) {
      fs.writeFileSync(`logs/${podName}_${container.name}.logs`, data, 'utf-8')
    })
  } catch (error) {

  }
}

kubeapi.get('pods/', function (err, data) {
  jsonfile.writeFileSync('pods.json', data)
  if (!data.items) return
  for (var pod of data.items) {
    podLogs(pod)
  }
  // console.log(err, data.kind, data.items)
})

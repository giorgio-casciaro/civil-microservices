// SERVICES DEPENDECIES
var start = async() => {
  const wait = require('sint-bit-utils/utils/wait')
  await wait.service('http://schema:10000/getSchema')
  await wait.service('http://users:10080/login')
  await wait.service('http://dashboards:10080/')
  await wait.service('http://couchbase_nodes:8091/')
  console.log('INIT SCHEMA')
  require('./service')()
}
start()

// SERVICES DEPENDECIES
var start = async() => {
  const wait = require('sint-bit-utils/utils/wait')
  await wait.service('http://couchbase:8091/', 5000, 5000)
  await wait.service('http://schema:10000/getSchema', 5000)
  console.log('INIT SCHEMA')
  require('./service')()
}
start()

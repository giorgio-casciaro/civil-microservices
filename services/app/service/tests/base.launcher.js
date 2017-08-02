process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})


var startTest = async function () {
  var SERVICE = require('../start')
  var netClient = SERVICE.netClient
  await require('./base.test')(netClient)

  SERVICE.netServer.stop()
  // SERVICE.schemaClient.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()

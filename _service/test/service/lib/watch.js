var fs = require('fs')
var path = require('path')
console.log('WATCH: ', process.argv)
var fileWatch = process.argv[2]
var nodeScript = process.argv[3]
var spawn = require('child_process').spawn
var basePath = process.cwd()
var execCommand
var execCommandFunc = function () {
  if (execCommand)execCommand.kill()
  // console.log('\x1Bc')
  console.log('--------------------------------------------')
  console.log('--------------WATCH RESTART-----------------')
  console.log('--------------------------------------------')
  execCommand = spawn('node', [ path.join(basePath, nodeScript) ])
  execCommand.stdout.on('data', data => console.log(data.toString()))
  execCommand.stderr.on('data', data => console.log(data.toString()))
  execCommand.on('close', code => { console.log(`child process exited with code ${code}`) })
}
// fs.watchFile(, execCommandFunc)
fs.watch(path.join(basePath, fileWatch), {recursive: true}, (eventType, filename) => {
  execCommandFunc()
})
execCommandFunc()

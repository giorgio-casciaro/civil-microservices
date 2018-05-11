var jsonfile = require('jsonfile')
var fs = require('fs')
var nodeGrok = require('node-grok')
var patterns = nodeGrok.loadDefaultSync()
// patterns.loadSync('grokPatterns')
var customPatternsStrings = fs.readFileSync('./grokPatterns', 'utf-8').split('\n')
var customPatterns = []
customPatternsStrings.forEach((patternString) => {
  customPatterns.push(patterns.createPattern(patternString))
})
function parseLogs (logString) {
  logString.split('\n').forEach((log) => {
    if (!log) return null
    var obj, pattern
    for (pattern of customPatterns) {
      obj = pattern.parseSync(log)
      if (obj) {
        console.log('--------------')
        console.log('EXPRESSION -->', pattern.expression)
        console.log('LOG        --> ', log.substr(0, 100))
        if (obj.jsonLog)obj.jsonLog = JSON.parse('{' + obj.jsonLog + '}')
        if (obj.jsonLogSecondary)obj.jsonLogSecondary = JSON.parse('{' + obj.jsonLogSecondary + '}')
        // console.log('PARSED     --> ', !!obj, obj ? obj.level : null, obj ? obj.year : null, obj ? obj.month : null)
        console.log('PARSEDLOG  --> ', obj)
        break
      }
    }
  })
}
parseLogs(fs.readFileSync('./grokTest.txt', 'utf-8'))

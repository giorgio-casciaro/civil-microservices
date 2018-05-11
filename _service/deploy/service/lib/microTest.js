var assert = require('assert')
const chalk = require('chalk')
const fs = require('fs')

var stdoutSaved = process.stdout.write
var stderrSaved = process.stderr.write
var stdoutData = []
var stderrData = []

var consoleMute = function () {
  stdoutData = []
  stderrData = []
  process.stdout.write = function (str, encoding, fd) { stdoutData.push(str.replace(/\r?\n|\r/g, '')) }
  process.stderr.write = function (str, encoding, fd) { stderrData.push(str.replace(/\r?\n|\r/g, '')) }
}
var consoleResume = function () {
  process.stdout.write = stdoutSaved
  process.stderr.write = stderrSaved
}

module.exports = function getTest (name, testVerbose) {
  var testNumber = 0
  var errors = 0
  var success = 0
  var skipped = 0
  var maxErrors = 1
  var startFunc = function () {
    consoleResume()
    console.info()
    console.info(chalk.grey(`------------------------START----------------------------`))
    console.info(chalk.white(`${name}`))
    console.info(chalk.grey(`----------------------------------------------------------------`))
    console.info()
  }
  // consoleMute()
  return {
    test: function (actual, expected, message = 'test', comparation = (a, e) => a, verbose = testVerbose) {
      if (testNumber === 0) startFunc()
      testNumber++
      consoleResume()
      try {
        if (errors < maxErrors) {
          // if (JSONcomparation(actual, expected) !== expected) throw new Error(message)
          assert.deepEqual(comparation(actual, expected), expected, 'deepEqual')
          success++
          console.info(chalk.green(`- ${testNumber} SUCCESS ${message}`))
          if (verbose)console.info(chalk.grey(JSON.stringify(actual, null, 4)))
          if (verbose > 1) {
            console.info()
            console.info(chalk.white.bgBlue('  CONSOLE LOGS  '))
            console.info(chalk.grey(stdoutData.join('\n\n')))
          }
        } else {
          if (skipped === 0) {
            console.info()
            console.info(chalk.yellow(`---> SKIPPING (errors > ${maxErrors})`))
          }
          skipped++
        }
      } catch (error) {
        errors++
        console.info(chalk.red(`x ${testNumber} ERROR ${message}`))
        console.info(chalk.grey(JSON.stringify(actual, null, 4)))
        console.info({comparation: comparation(actual, expected), expected})
        console.info()
        console.info(chalk.white.bgRed('  CONSOLE ERRORS  '))
        console.info(chalk.grey(stderrData.join('\n\n')))
        console.info()
        console.info(chalk.white.bgBlue('  CONSOLE LOGS  '))
        console.info(chalk.grey(stdoutData.join('\n\n')))
      }
      consoleMute()
    },
    start: startFunc,
    finish: function () {
      consoleResume()
      console.info()
      console.info(chalk.grey(`------------------------RESULTS----------------------------`))
      console.info(`NAME: ${name}`)
      console.info(chalk.grey(`TOTAL: ${testNumber}`), chalk.green(`SUCCESS: ${success}`), chalk.red(`ERRORS: ${errors}`), chalk.yellow(`SKIPPED: ${skipped}`))
      console.info(chalk.grey(`----------------------------------------------------------------`))
    }
  }
}

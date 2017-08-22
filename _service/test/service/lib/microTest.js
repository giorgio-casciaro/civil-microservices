var assert = require('assert')
const chalk = require('chalk')

module.exports = function getTest (name) {
  console.info(`## TEST ${name} ##`)
  var testNumber = 0
  return function test (actual, expected, message = 'test') {
    testNumber++
    try {
      assert.deepStrictEqual(actual, expected, 'View create 1 item')
      console.info(chalk.green(`- ${testNumber} SUCCESS ${message}`))
      console.log({ test: testNumber, success: true, message: message})
    } catch (error) {
      console.info(chalk.red(`x ${testNumber} ERROR ${message}`))
      console.error({test: testNumber, success: false, message: error.message, actual: error.actual, expected: error.expected})
    }
  }
}

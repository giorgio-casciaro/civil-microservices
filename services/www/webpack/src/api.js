import Vue from 'vue'
import VueResource from 'vue-resource'
import store from '@/store'
import toFormData from '@/lib/toFormData'

var apiServer = '/api'
if (window.location.port === '8080' || window.location.port === 8080)apiServer = `https://${window.location.hostname}/api`

Vue.use(VueResource)

var Ajv = require('ajv')
var ajv = new Ajv({ coerceTypes: true, allErrors: true, removeAdditional: false }) // options can be passed, e.g. {allErrors: true}
const clearModel = function (data) { for (var i in data) if (data[i] === '')data[i] = undefined }
export function validate (schema, data, clear = true, extraValidation = (data, valid, errors) => false) {
  var validate = ajv.compile(schema)
  return validateCore(validate, data, clear, extraValidation)
}
function validateCore (validate, data, clear = true, extraValidation = (data, valid, errors) => false) {
  if (clear)clearModel(data)
  var valid = validate(data)
  var errors = {}
  if (validate.errors) {
    validate.errors.forEach(error => {
      var path = error.dataPath ? error.dataPath.replace('.', '') : ''
      var msg = error.message
      if (error.keyword === 'format' || error.keyword === 'pattern') {
        msg = 'Formato non valido'
      } else if (error.keyword === 'required') {
        path = error.params.missingProperty
        msg = 'Campo richiesto'
      }
      if (!errors[path])errors[path] = []
      errors[path].push(msg)
    })
  }
  extraValidation(data, valid, errors)
  // console.log('validation', {data, valid, validate: validate.errors, errors})
  return {valid, errors}
}
export async function call ({url, data, schema = null, clear = true, bodyOnly = true}) {
  try {
    if (clear)clearModel(data)
    if (schema) var validation = validate(schema, data)
    if (schema && !validation.valid) throw new Error({msg: 'Campi non validi, controlla il form e riprova', validation})
    var options = { headers: {'app-meta-token': store.state.users ? store.state.users.token : false}, emulateJSON: true }
    var formData = toFormData(data)
    var resp = await Vue.http.post(apiServer + '/' + url, formData, options)
    console.log('call resp', resp)
    if (resp.error) throw new Error(resp)
    if (bodyOnly) return resp.body
    return resp
  } catch (error) {
    console.error('API CALL', error, { url, data, validation, clear })
    throw error
  }
}

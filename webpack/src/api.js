import * as Cookies from 'js-cookie'
import Vue from 'vue'

// var apiServer = '/api'
// if (window.location.port === '8080' || window.location.port === 8080)apiServer = `https://0.0.0.0/api`
var apiServer = process.env.apiServer
console.log('apiServer', apiServer)
export function toFormData (obj, form, namespace) {
  let fd = form || new FormData()
  let formKey
  for (let property in obj) {
    if (obj.hasOwnProperty(property)) { // && obj[property]
      if (namespace) formKey = namespace + '[' + property + ']'
      else formKey = property
      if (obj[property] instanceof Date) fd.append(formKey, obj[property].toISOString())
      else if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) toFormData(obj[property], fd, formKey)
      else fd.append(formKey, obj[property])
    }
  }
  console.log('toFormData', Array.from(fd.entries()))
  return fd
}

export async function httpRequest (url, data, headers = {}) {
  try {
    var token = Cookies.get('civil-connect-token')
    var options = { headers, emulateJSON: true }
    if (token)options.headers['app-meta-token'] = token
    var formData = toFormData(data)
    var resp = await Vue.http.post(url, formData, options)
    console.log('httpRequest resp', resp)
    return resp.body
  } catch (error) {
    console.error('API CALL', error, { url, data })
    throw error
  }
}

export function getToken (url, data, headers = {}) {
  return Cookies.get('civil-connect-token')
}
export function getApiServer () {
  return apiServer
}

var Ajv = require('ajv')
var ajv = new Ajv({ coerceTypes: true, allErrors: true, removeAdditional: false }) // options can be passed, e.g. {allErrors: true}
export function validate (schema, method, data, extraValidation = (data, valid, errors) => false, clear = true) {
  var ajvValidate = ajv.compile(schema)
  var errors = {}
  if (clear) for (var i in data) if (data[i] === '') delete data[i]
  var ajvValidateRes = ajvValidate(data)
  console.log('validate.errors', ajvValidate.errors, ajvValidateRes, schema)
  if (ajvValidate.errors) {
    ajvValidate.errors.forEach(error => {
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
  extraValidation(data, ajvValidateRes, errors)
  return {valid: ajvValidateRes, errors}
}

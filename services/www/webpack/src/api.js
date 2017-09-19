import Vue from 'vue'
import schema from './api.schema.json'
import store from '@/store'
import toFormData from '@/lib/toFormData'

var Ajv = require('ajv')
var ajv = new Ajv({ coerceTypes: true, allErrors: true, removeAdditional: false }) // options can be passed, e.g. {allErrors: true}
const getCompiledSchema = (service, schemaMethod) => {
  if (!schema.publicSchema || !schema.publicSchema[service] || !schema.publicSchema[service][schemaMethod]) throw new Error('getCompiledSchema: ' + service + ' ' + schemaMethod + ' not defined')
  return ajv.compile(schema.publicSchema[service][schemaMethod])
}
const clearModel = function (model) { for (var i in model) if (model[i] === '')model[i] = undefined }

export function validate (service, schemaMethod, model, clear = true, extraValidation = (model, valid, errors) => false) {
  var validate = getCompiledSchema(service, schemaMethod)
  return validateCore(validate, model, clear, extraValidation)
}
export function validateRaw (schema, model, clear = true, extraValidation = (model, valid, errors) => false) {
  var validate = ajv.compile(schema)
  return validateCore(validate, model, clear, extraValidation)
}
function validateCore (validate, model, clear = true, extraValidation = (model, valid, errors) => false) {
  if (clear)clearModel(model)
  var valid = validate(model)
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
  extraValidation(model, valid, errors)
  console.log('validation', {model, valid, validate: validate.errors, errors})
  return {valid, errors}
}
export function call (service, method, model, successFunc, errorFunc, validation = true, clear = true) {
  if (!errorFunc) errorFunc = (msg, error) => console.error('API CALL', msg, error, {service, method, model, successFunc, errorFunc, validation, clear})
  try {
    if (clear)clearModel(model)
    if (validation === true)validation = validate(service, method, model)
    if (validation && !validation.valid) return errorFunc('Campi non validi, controlla il form e riprova', validation)
    var resolve = ({body}) => {
      console.log('api call response', body)
      if (body.error) return errorFunc(body.error, body)
      successFunc(body)
    }
    var reject = (error) => {
      console.log('api call error', error)
      errorFunc('Errore nell\'invio del form', error)
      store.commit('ERROR', {service, method, model, error})
    }
    var options = {
      headers: {
        'app-meta-token': store.state.users ? store.state.users.token : false
      },
      emulateJSON: true
    }
    console.log('model', model, options)
    var formData = toFormData(model)
    Vue.http.post(store.state.apiServer + '/' + service + '/' + method, formData, options).then(resolve).catch(reject)
  } catch (error) {
    return errorFunc('Generic error', error)
  }
}

import Vue from 'vue'
import schema from './api.schema.json'
import store from '@/store'
import toFormData from '@/lib/toFormData'

var Ajv = require('ajv')
var ajv = new Ajv({allErrors: true}) // options can be passed, e.g. {allErrors: true}
const getCompiledSchema = (service, schemaMethod) => ajv.compile(schema.publicSchema[service][schemaMethod])
const clearModel = function (model) { for (var i in model) if (model[i] === '')model[i] = undefined }
export function validate (service, schemaMethod, model, clear = true, extraValidation = (model, valid, errors) => false) {
  var validate = getCompiledSchema(service, schemaMethod)
  if (clear)clearModel(model)
  var valid = validate(model)
  var errors = {}
  if (validate.errors) {
    validate.errors.forEach(error => {
      var path = error.dataPath.replace('.', '')
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
export function call (service, method, model, successFunc, errorFunc, validation, clear = true) {
  if (clear)clearModel(model)
  if (!validation)validation = validate(service, method, model)
  if (!validation.valid) return errorFunc('Campi non validi, controlla il form e riprova', validation)
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
  var formData = toFormData(model)
  Vue.http.post(store.state.apiServer + '/' + service + '/' + method, formData, options).then(resolve).catch(reject)
}

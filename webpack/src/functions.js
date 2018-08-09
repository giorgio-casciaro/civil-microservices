import * as Cookies from 'js-cookie'
import Vue from 'vue'
// import VueResource from 'vue-resource'
import store from '@/store'
import * as moment from 'moment'

// var apiServer = '/api'
// if (window.location.port === '8080' || window.location.port === 8080)apiServer = `https://0.0.0.0/api`
var apiServer = process.env.apiServer

var translationsNotFounded = {}
var dt = false
const sendNotFounded = () => console.log('users translations sendNotFounded', translationsNotFounded)
const getTranslation = (translations, group, string) => {
  if (translations && translations[group] && translations[group][string]) {
    translations[group][string].counter++
    return translations[group][string].string
  }
  return false
}
export function translate (group, string, number) {
  // console.log('translate', group, string, store.state.translations)
  var translation = getTranslation(store.state.translations, group, string)
  if (translation) return translation
  if (!translationsNotFounded[string]) {
    // console.log('translationsNotFounded', string)
    translationsNotFounded[string] = string
    if (dt)clearTimeout(dt)
    dt = setTimeout(sendNotFounded, 1000)
  }
  return string
}
export function toDate (timestamp, format) {
  moment.locale(store.state.locale || 'it')
  return moment(parseInt(timestamp)).format(format || 'dddd, D MMMM YYYY, h:m:s')
}

export function randomPassword (length) {
  var chars = 'abcdefghijklmnopqrstuvwxyz#?!@$%^&*-ABCDEFGHIJKLMNOP1234567890'
  var charsLower = 'abcdefghijklmnopqrstuvwxyz'
  var charsUpper = 'ABCDEFGHIJKLMNOP'
  var charsNumbers = '1234567890'
  var pass = ''
  for (var x = 0; x < length; x++) {
    var i = Math.floor(Math.random() * chars.length)
    pass += chars.charAt(i)
  }
  pass += charsLower.charAt(Math.floor(Math.random() * charsLower.length))
  pass += charsUpper.charAt(Math.floor(Math.random() * charsUpper.length))
  pass += charsNumbers.charAt(Math.floor(Math.random() * charsNumbers.length))
  return pass
}
export function applyBeMutation (store, viewId, mutationName, mutationData) {
  // var viewId = result.id || dataToSend[index].id
  // console.log('rpcCallAndMutation viewId', {viewId})
  if (!store.state.views[viewId])store.state.views[viewId] = {}
  var view = store.state.views[viewId]
  var mutationNameWithExt = mutationName + '.js'
  var mutation = store.state.rpcServiceInfo.mutations && store.state.rpcServiceInfo.mutations[mutationNameWithExt] ? store.state.rpcServiceInfo.mutations[mutationNameWithExt] : (state, data) => state
  console.log('rpcCallAndMutation view before mutation', {viewId, mutationName, view, mutation})
  view = mutation(view, mutationData)
  console.log('rpcCallAndMutation view after mutation', {view, mutationData, mutation})
  return view
}

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
// export async function call ({url, data, schema = null, clear = true, bodyOnly = true, token = false}) {
//   try {
//     var options = { headers: {}, emulateJSON: true }
//     if (token)options.headers['app-meta-token'] = token
//     var formData = toFormData(data)
//     var resp = await Vue.http.post(apiServer + '/' + url, formData, options)
//     console.log('call resp', resp)
//     if (resp.error) throw new Error(resp)
//     if (bodyOnly) return resp.body
//     return resp
//   } catch (error) {
//     console.error('API CALL', error, { url, data, validation, clear })
//     throw error
//   }
// }

export async function call (url, data, headers = {}) {
  try {
    var token = Cookies.getJSON('civil-connect-token')
    var options = { headers, emulateJSON: true }
    if (token)options.headers['app-meta-token'] = token
    var formData = toFormData(data)
    var resp = await Vue.http.post(url, formData, options)
    console.log('call resp', resp)
    return resp.body
  } catch (error) {
    console.error('API CALL', error, { url, data })
    throw error
  }
}
export function getToken (url, data, headers = {}) {
  return Cookies.getJSON('civil-connect-token')
}
export function setToken (token) {
  return Cookies.setJSON('civil-connect-token', token)
}
export function getApiServer () {
  return apiServer
}

var Ajv = require('ajv')
var ajv = new Ajv({ coerceTypes: true, allErrors: true, removeAdditional: false }) // options can be passed, e.g. {allErrors: true}
export function validate (schema, data, clear = true, extraValidation = (data, valid, errors) => false) {
  var ajvValidate = ajv.compile(schema)
  var errors = {}
  if (clear) for (var i in data) if (data[i] === '') delete data[i]
  var valid = ajvValidate(data)
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
  return {valid, errors}
}

import store from '@/store'
import * as moment from 'moment'

var notFounded = {}
var dt = false
const sendNotFounded = () => console.log('users translations sendNotFounded', notFounded)
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
  if (!notFounded[string]) {
    // console.log('notFounded', string)
    notFounded[string] = string
    if (dt)clearTimeout(dt)
    dt = setTimeout(sendNotFounded, 1000)
  }
  return string
}
export function toDate (timestamp, format) {
  moment.locale(store.state.locale || 'it')
  return moment(parseInt(timestamp)).format(format || 'dddd, D MMMM YYYY, h:m:s')
}

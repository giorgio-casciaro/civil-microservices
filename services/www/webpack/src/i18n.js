import store from '@/store'
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
export function translate (group, string) {
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

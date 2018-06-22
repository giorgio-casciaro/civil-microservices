export default function toFormData (obj, form, namespace) {
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

<template>
  <form class="Login" @click="active=true" @submit.prevent="waiting=true; call('users','confirmEmail',form,succ,err)" @input="validation=validate('users','confirmEmail',form)" :class="{validForm:validation.valid,activeForm:active}">
    <label class="email" v-if="!this.setEmail"  :class="{notValid:validation.errors.email}"><strong>{{strEmail}}</strong><input :placeholder="strPhEmail" :disabled="waiting" type="email" v-model="form.email" /></label>
    <label class="code"  :class="{notValid:validation.errors.emailConfirmationCode}" ><strong>{{strEmailConfirmationCode}}</strong><input v-model="form.emailConfirmationCode" :disabled="waiting"  type="text" /></label>
    <input type="submit" class="confirmEmail button" :disabled="waiting" :class="{error,success,waiting}" :value="strConfirmEmail">
    <div v-if="success" class="success" v-html="success"></div>
    <div v-if="error" class="error" v-html="error"></div>
    <div v-if="errors" class="errors">
      <div v-for="(fieldErrors,fieldName) in errors" class="fieldErrors">
        <div v-for="error in fieldErrors" class="error"><strong>{{fieldName}}</strong> {{t(error)}}</div>
      </div>
    </div>
  </form>
</template>

<script>
import {translate} from '@/translations'
var t= function(string) { return translate( 'users', string) }
import {validate, call} from '@/api'

export default {
  name: 'ConfirmEmail',
  props:['setEmail','setEmailConfirmationCode'],
  created () {
    if (this.setEmail) this.form.email = this.setEmail
    if (this.setEmailConfirmationCode) this.form.emailConfirmationCode = this.setEmailConfirmationCode
  },
  mounted(){
    if (this.setEmail && this.setEmailConfirmationCode){
      this.waiting=1
      this.call('users', 'confirmEmail', this.form, this.succ, this.err)
    }
  },
  data () {
    return {
      form: {
        emailConfirmationCode: '',
        email: ''
      },
      active: false,
      error: false,
      success: false,
      waiting: false,
      errors:false,
      validation: {
        errors: {}
      }
    }
  },
  computed: {
    strPhEmail: function () { return t( 'email@esempio.com') },
    strConfirmEmail: function () { return t(  'Conferma email') },
    strEmailConfirmationCode: function () { return t(  'Codice di conferma') },
    strEmail: function () { return t(  'Email') }
  },
  methods: {
    validate,
    t,
    call,
    err (msg, extra = false) {
        this.error = this.errors= this.waiting=false
        setTimeout(()=>this.error = t( msg),1)
        setTimeout(()=>this.errors = extra.errors,1)
        this.$emit("error")
    },
    succ (body) {
      this.waiting=false
      this.$store.commit('users/EMAIL_CONFIRMED', body)
      this.success = t( 'Email confermata')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}
</script>

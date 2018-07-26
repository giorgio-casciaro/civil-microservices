<template>
  <form class="AssignPassword" @click="active=true" @submit.prevent="waiting=true;call('users','assignPassword',form,succ,err)" @input="validation=validate('users','assignPassword',form)" :class="{validForm:validation.valid,activeForm:active}">
    <label class="email" v-if="!this.setEmail"  :class="{notValid:validation.errors.email}"><strong>{{strEmail}}</strong><input :placeholder="strPhEmail" :disabled="waiting" type="email" v-model="form.email" /></label>
    <label class="password" :class="{notValid:validation.errors.password}"><strong>{{strPassword}}</strong><input v-model="form.password" :disabled="waiting"  type="password"/></label>
    <label class="confirmPassword" :class="{notValid:validation.errors.confirmPassword}"><strong>{{strConfirmPassword}}</strong><input v-model="form.confirmPassword"  :disabled="waiting"  type="password"/></label>
    <input type="submit" class="assignPassword button" :disabled="waiting" :class="{error,success,waiting}" :value="strAssignPassword">
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
import {validate,call} from '@/api'

export default {
  name: 'AssignPassword',
  created () {
    if(this.setEmail)this.form.email=this.setEmail
  },
  props:['setEmail'],
  data () {
    return {
      form:{
        password: '',
        confirmPassword: '',
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
    strAssignPassword: function () { return t(  'Assegna password') },
    strEmail: function () { return t(  'Email') },
    strPassword: function () { return t(  'Password') },
    strConfirmPassword: function () { return t(  'Conferma password') }
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
      this.$store.commit('users/REGISTERED', body)
      this.success = t( 'Password Assegnata')
      setTimeout(()=>this.$emit("success"),2000)
      //autologin
      this.call('users','login',this.form,(body)=>this.$store.dispatch('users/login', body),(error)=>console.log(error))
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

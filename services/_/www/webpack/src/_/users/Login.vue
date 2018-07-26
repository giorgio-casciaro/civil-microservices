<template>
<form class="Login" @click="active=true" @submit.prevent="login()" @input="validation=validate('users','login',{email:form.email})" :class="{validForm:validation.valid,activeForm:active}">
  <input class="email" :placeholder="strPhEmail" :disabled="waiting" type="email" v-model="form.email" :class="{notValid:validation.errors.email}" />
  <input class="password" :placeholder="strPhPassword" :disabled="waiting" type="password" v-model="form.password" />
  <input type="submit" class="login button" :disabled="waiting" :class="{error,success,waiting}" :value="strLogin">
  <label class="rememberMe"><input type="checkbox" :disabled="waiting" v-model="rememberMe" />{{strRememberMe}}</label>
  <a class="lostPassword">{{strLostPassword}}</a>
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
import Vue from 'vue'
import {translate} from '@/translations'
var t= function(string) { return translate( 'users', string) }
import {validate,call} from '@/api'
export default {
  name: 'Login',
  data () {
    return {
      form: {
        password: '',
        email: '',
      },
      rememberMe:true,
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
    strLogin: function () { return t( 'Accedi') },
    strPhEmail: function () { return t( 'email@esempio.com') },
    strPhPassword: function () { return t( 'password') },
    strRememberMe: function () { return t( 'Ricordami') },
    strLostPassword: function () { return t( 'Hai dimenticato la password?') }
  },
  methods: {
    t,
    validate,
    call,
    login () {
      this.waiting=true;
      this.call('users','login',this.form,this.succ,this.err)
    },
    err (msg, extra = false) {
        this.error = this.errors= this.waiting=false
        setTimeout(()=>this.error = t( msg),1)
        setTimeout(()=>this.errors = extra.errors,1)
        this.$emit("error")
    },
    succ (body) {
      body.rememberMe=this.rememberMe
      this.waiting=false
      this.$store.dispatch('users/login', body)
      this.success = t( 'Login avvenuto con successo')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}

</script>

<style scoped>

</style>

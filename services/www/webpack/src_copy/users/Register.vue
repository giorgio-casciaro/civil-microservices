<template>
<form class="Register" @click="active=true" @submit.prevent="waiting=true;call('users','create',form,succ,err)" @input="validation=validate('users','create',form)" :class="{validForm:validation.valid,activeForm:active}">
  <input class="email" :placeholder="strPhEmail" :disabled="waiting" type="email" v-model="form.email" :class="{notValid:validation.errors.email}" />
  <input type="submit" class="register button" :disabled="waiting" :class="{error,success,waiting}" :value="strRegister">
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
import {translate} from '@/i18n'
var t= function(string) { return translate( 'users', string) }
import {validate,call} from '@/api'

export default {
  name: 'Register',
  data () {
    return {
      form: {
        email: '',
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
    strRegister: function () { return t(  'Registrati') },
    strPhEmail: function () { return t(  'email@esempio.com') }
  },
  methods: {
    t,
    validate,
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
      this.success = t( 'Registrazione avvenuta con successo')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

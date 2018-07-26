<template>
  <form class="ChangePassword" @click="active=true" @submit.prevent="waiting=true;call('users','updatePassword',form,succ,err)" @input="validation=validate('users','updatePassword',form)" :class="{validForm:validation.valid,activeForm:active}">
    <label class="oldPassword" :class="{notValid:validation.errors.oldPassword}"><strong>{{str.oldPassword}}</strong><input v-model="form.oldPassword" :disabled="waiting"  type="password" :placeholder="strPh.oldPassword"/></label>
    <label class="password" :class="{notValid:validation.errors.password}"><strong>{{str.password}}</strong><input v-model="form.password" :placeholder="strPh.password" :disabled="waiting"  type="password" /></label>
    <label class="confirmPassword" :class="{notValid:validation.errors.confirmPassword}"><strong>{{str.confirmPassword}}</strong><input v-model="form.confirmPassword" :disabled="waiting"  type="password" :placeholder="strPh.confirmPassword"/></label>
    <input type="submit" class="save button" :disabled="waiting" :class="{error,success,waiting}" :value="str.submit">
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
  name: 'ChangePassword',
  created () {
    if(this.setEmail)this.form.email=this.setEmail
  },
  props:['setEmail'],
  data () {
    return {
      form:{
        id: this.$store.state.users.id,
        oldPassword: undefined,
        password: undefined,
        confirmPassword: undefined,
      },
      str:{
        submit: t( 'Cambia Password'),
        oldPassword: t( 'Vecchia password'),
        password: t( 'Nuova password'),
        confirmPassword: t( 'Conferma nuova password')
      },
      strPh:{
        oldPassword: t( 'es. miA-pAssWord_1$'),
        password: t( 'es. miA-pAssWord_1$'),
        confirmPassword: t( '')
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
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

<template>
  <form class="PublicName" @click="active=true" @submit.prevent="waiting=true;call('users','updatePublicName',form,succ,err)" @input="validation=validate('users','updatePublicName',form)" :class="{validForm:validation.valid,activeForm:active}">
    <label class="publicName":class="{notValid:validation.errors.publicName}"><strong>{{str.publicName}}</strong><input v-model="form.publicName" :placeholder="strPh.publicName" :disabled="waiting" type="text" /></label>
    <input type="submit" class="save button" :disabled="waiting" :class="{error,success,waiting}" :value="str.save">
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
  name: 'PublicName',
  data () {
    return {
      form:{
        publicName: this.$store.state.users.currentUser.publicName,
        id: this.$store.state.users.currentUser.id
      },
      str:{
        publicName: t( 'Nome Pubblico'),
        save:t( 'Salva')
      },
      strPh:{
        publicName: t( '')
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
      this.$store.dispatch('users/update', {mutation:'PUBLICNAME_UPDATED',payload:this.form})
      this.success = t( 'Nome pubblico aggiornato')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}
</script>

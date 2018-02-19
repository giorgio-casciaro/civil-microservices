<template>
  <form class="PersonalInfo" @click="active=true" @submit.prevent="waiting=true;call('users','updatePersonalInfo',form,succ,err)" @input="validation=validate('users','updatePersonalInfo',form)" :class="{validForm:validation.valid,activeForm:active}">
    <label class="firstName":class="{notValid:validation.errors.firstName}"><strong>{{str.firstName}}</strong><input v-model="form.firstName" :placeholder="strPh.firstName" :disabled="waiting" type="text" /></label>
    <label class="lastName":class="{notValid:validation.errors.lastName}"><strong>{{str.lastName}}</strong><input v-model="form.lastName" :placeholder="strPh.lastName" :disabled="waiting" type="text" /></label>
    <label class="birth":class="{notValid:validation.errors.birth}"><strong>{{str.birth}}</strong><InputDate :timestamp.sync="form.birth" :disabled="waiting" /></label>
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
import InputDate from './InputDate'

import {translate} from '@/i18n'
var t= function(string) { return translate( 'users', string) }
import {validate,call} from '@/api'

export default {
  name: 'PersonalInfo',
  components:{InputDate},
  data () {
    return {
      form:{
        id: this.$store.state.users.currentUser.id,
        firstName: this.$store.state.users.currentUser.firstName||undefined,
        lastName: this.$store.state.users.currentUser.lastName||undefined,
        birth: this.$store.state.users.currentUser.birth||undefined
      },
      str:{
        firstName: t( 'Nome'),
        lastName: t( 'Cognome'),
        birth: t( 'Data di nascita'),
        datePattern: ( 'dd/MM/yy GGGGG'),
        save:t( 'Salva'),
      },
      strPh:{
        firstName: t( 'il tuo nome'),
        lastName: t( 'il tuo cognome'),
        birth: t( 'gg/mm/aaaa')
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
      this.$store.dispatch('users/update', {mutation:'PERSONAL_INFO_UPDATED',payload:this.form})
      this.success = t( 'Informazioni personali aggiornate')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}
</script>

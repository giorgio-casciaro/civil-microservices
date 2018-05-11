<template>
  <form class="Login" @click="active=true" @submit.prevent="waiting=true; action_rpcCallAndMutationSingle({rpcMethod:'confirmEmail',data:form,success:succ,error:err})" @input="validation=getter_rpcValidate({rpcMethod:'confirmEmail',data:form,multiToSingle:true})" :class="{validForm:validation.valid,activeForm:active}">
    <label class="email" v-if="!this.setEmail"  :class="{notValid:validation.errors.email}"><strong>{{getter_t('Email')}}</strong><input :placeholder="getter_t('Email')" :disabled="waiting" type="email" v-model="form.email" /></label>
    <label class="code"  :class="{notValid:validation.errors.emailConfirmationCode}" ><strong>{{getter_t('Codice conferma email')}}</strong><input v-model="form.emailConfirmationCode" :disabled="waiting"  type="text" /></label>
    <input type="submit" class="confirmEmail button" :disabled="waiting" :class="{error,success,waiting}" :value="getter_t('Conferma email')">
    <successAndErrors :success="success"  :error="error" :errors="errors" />
  </form>
</template>
<script>
import storeMixin from '../storeMixin'
export default {
  mixins: [storeMixin],
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
      form: { emailConfirmationCode: '', email: '' },
      active: false,
      error: false,
      success: false,
      waiting: false,
      errors:false,
      validation: { errors: {} }
    }
  },
  methods: {
    err (errorObj, extra = false) {
      this.error = this.errors= this.waiting=false
      setTimeout(()=>this.error = this.getter_t(errorObj.error),1)
      // setTimeout(()=>this.errors = extra.errors,1)
      this.$emit("error")
    },
    succ (body) {
      this.waiting=false
      // this.$store.commit('users/EMAIL_CONFIRMED', body)
      this.success = this.getter_t( 'Email confermata')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}

</script>

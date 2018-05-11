<template>
<form class="Register" @click="active=true" @submit.prevent="waiting=true;action_rpcCallAndMutation({rpcMethod:'createMulti',data:form,success:succ,error:err,multiToSingle:true})" @input="validation=getter_rpcValidate({rpcMethod:'createMulti',data:form,multiToSingle:true})" :class="{validForm:validation.valid,activeForm:active}">
  <input class="email" :placeholder="getter_t('Email')" :disabled="waiting" type="email" v-model="form.email" :class="{notValid:validation.errors&&validation.errors.email}" />
  <input type="submit" class="register button" :disabled="waiting" :class="{error,success,waiting}" :value="getter_t('Registrati')">
  <successAndErrors :success="success"  :error="error" :errors="errors" />
</form>
</template>


<script>
import storeMixin from '../storeMixin'
export default {
  mixins: [storeMixin],
  data () {
    return {
      form: { email: '' },
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
      // this.$store.commit('users/REGISTERED', body)
      this.success = this.getter_t( 'Registrazione avvenuta con successo')
      console.log("Registrazione avvenuta con successo'",body)
      // this.$emit("success")
      setTimeout(()=>this.$emit("success",body),2000)
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

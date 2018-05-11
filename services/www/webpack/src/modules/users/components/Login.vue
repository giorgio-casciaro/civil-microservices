<template>
<form class="Login" @click="active=true" @submit.prevent="waiting=true;action_rpcCallAndStoreActionSingle({rpcMethod:'login',action:'login',data:form,success:succ,error:err})" @input="validation=getter_rpcValidate({rpcMethod:'login',data:form})" :class="{validForm:validation.valid,activeForm:active}">
  <input class="email" :placeholder="getter_t('Email')" :disabled="waiting" type="email" v-model="form.email" :class="{notValid:validation.errors.email}" />
  <input class="password" :placeholder="getter_t('Password')" :disabled="waiting" type="password" v-model="form.password" />
  <input type="submit" class="login button" :disabled="waiting" :class="{error,success,waiting}" :value="getter_t('Login')">
  <label class="rememberMe"><input type="checkbox" :disabled="waiting" v-model="rememberMe" />{{getter_t('Ricordami')}}</label>
  <a class="lostPassword">{{getter_t('Hai dimenticato la password?')}}</a>
  <successAndErrors :success="success"  :error="error" :errors="errors" />
</form>
</template>

<script>
import storeMixin from '../storeMixin'
export default {
  mixins: [storeMixin],
  methods:{
    err (rpcResponse) {
      this.error = this.errors = this.waiting = false
      setTimeout(()=>this.error = this.getter_t(rpcResponse.error),1)
      // setTimeout(()=>this.errors = extra.errors,1)
      this.$emit("error")
    },
    succ (rpcResponse) {
      rpcResponse.rememberMe = this.rememberMe
      this.waiting = false
      this.success = this.getter_t('Login avvenuto con successo')
      setTimeout(()=>this.$emit("success",rpcResponse),2000)
    }
  },
  data () {
    return {
      form: { password: '', email: '', },
      rememberMe:true,
      active: false,
      error: false,
      success: false,
      waiting: false,
      errors:false,
      validation: { errors: {} }
    }
  }
}
</script>

<style scoped>

</style>

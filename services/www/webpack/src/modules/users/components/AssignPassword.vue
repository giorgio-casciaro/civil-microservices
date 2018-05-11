<template>
  <form class="AssignPassword" @click="active=true" @submit.prevent="waiting=true;action_rpcCallAndMutationSingle({rpcMethod:'assignPassword',data:form,success:succ,error:err})" @input="validation=getter_rpcValidate({rpcMethod:'assignPassword',data:form,multiToSingle:true})" :class="{validForm:validation.valid,activeForm:active}">
    <label class="email" v-if="!this.setEmail"  :class="{notValid:validation.errors.email}"><strong>{{getter_t('Email')}}</strong><input :placeholder="getter_t('email@esempio.com')" :disabled="waiting" type="email" v-model="form.email" /></label>
    <label class="password" :class="{notValid:validation.errors.password}"><strong>{{getter_t('Password')}}</strong><input v-model="form.password" :disabled="waiting"  type="password"/></label>
    <label class="confirmPassword" :class="{notValid:validation.errors.confirmPassword}"><strong>{{getter_t('Conferma Password')}}</strong><input v-model="form.confirmPassword"  :disabled="waiting"  type="password"/></label>
    <input type="submit" class="assignPassword button" :disabled="waiting" :class="{error,success,waiting}" :value="getter_t('Assegna password')">
    <successAndErrors :success="success"  :error="error" :errors="errors" />
  </form>
</template>

<script>
import storeMixin from '../storeMixin'
export default {
  mixins: [storeMixin],
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
  // computed: {
  //   strPhEmail: function () { return t( 'email@esempio.com') },
  //   strAssignPassword: function () { return t(  'Assegna password') },
  //   strEmail: function () { return t(  'Email') },
  //   strPassword: function () { return t(  'Password') },
  //   strConfirmPassword: function () { return t(  'Conferma password') }
  // },
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
      this.success = this.getter_t( 'Password Assegnata')
      setTimeout(()=>this.$emit("success"),2000)
      this.action_rpcCallAndStoreMutationSingle({rpcMethod:'login',mutation:'LOGIN',data:{email:this.form.email,password:this.form.password},success:(msg)=>console.log("action_rpcCallAndStoreMutation success",msg),error:(msg)=>console.log("action_rpcCallAndStoreMutation error",msg)})
    }
    // err (msg, extra = false) {
    //     this.error = this.errors= this.waiting=false
    //     setTimeout(()=>this.error = t( msg),1)
    //     setTimeout(()=>this.errors = extra.errors,1)
    //     this.$emit("error")
    // },
    // succ (body) {
    //   this.waiting=false
    //   this.$store.commit('users/REGISTERED', body)
    //   this.success = t( 'Password Assegnata')
    //   setTimeout(()=>this.$emit("success"),2000)
    //   //autologin
    //   this.call('users','login',this.form,(body)=>this.$store.dispatch('users/login', body),(error)=>console.log(error))
    // }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

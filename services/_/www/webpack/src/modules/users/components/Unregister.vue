<template>
  <form class="Unregister" @click="active=true" @submit.prevent="remove" @input="validForm=(code===confirm)"  :class="{validForm,activeForm:active}">
    <div >
      <h5 v-html="str.title"></h5>
      <p v-html="str.description"></p>
      <div class="code" v-html="code"></div>
      <input type="number" v-model="confirm" :disabled="waiting" :class="{notValid:(confirm&&code!==confirm)}" />
    </div>
    <input type="submit" class="save button" :disabled="waiting" :class="{error,success,waiting}" :value="str.submit">
    <div v-if="success" class="success" v-html="success"></div>
    <div v-if="error" class="error" v-html="error"></div>
  </form>
</template>

<script>
import {translate} from '@/translations'
var t= function(string) { return translate( 'users', string) }
import {validate,call} from '@/api'

export default {
  name: 'Unregister',
  created () {
    if(this.setEmail)this.form.email=this.setEmail
  },
  props:['setEmail'],
  data () {
    return {
      code: Math.floor(Math.random()*10000).toString(),
      confirm: '',
      validForm:false,
      form:{
        id: this.$store.state.users.currentUser.id
      },
      str:{
        submit: t( 'Disiscriviti'),
        title: t( 'Conferma Disattivazione'),
        description: t( 'copia il codice di seguito per confermare la disattivazione')
      },
      strPh:{
        confirm: t( '')
      },
      active: false,
      error: false,
      success: false,
      waiting: false,
      errors:false
    }
  },
  methods: {
    validate,
    t,
    call,
    remove(){
      this.waiting=true;
      if(this.code!==this.confirm)return (this.error = t("Codice di conferma errato"))
      call('users','remove',this.form,this.succ,this.err)
    },
    err (msg, extra = false) {
        this.error = this.errors= this.waiting=false
        setTimeout(()=>this.error = t( msg),1)
        setTimeout(()=>this.errors = extra.errors,1)
        this.$emit("error")
    },
    succ (body) {
      this.waiting=false
      this.$store.commit('users/LOGGEDOUT', body)
      this.success = t( 'User disattivato correttamente')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

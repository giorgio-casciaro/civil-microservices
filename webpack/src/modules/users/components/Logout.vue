<template>
<form class="Logout"  @submit.prevent="waiting=true;call('users','logout',form,succ,err)"  >
  <input type="submit" class="logout button" :disabled="waiting" :class="{error,success,waiting}" :value="strLogout">
  <div v-if="success" class="success" v-html="success"></div>
  <div v-if="error" class="error" v-html="error"></div>
</form>
</template>

<script>
import Vue from 'vue'
import {translate} from '@/translations'
var t= function(string) { return translate( 'users', string) }
import {validate,call} from '@/api'
export default {
  name: 'Logout',
  data () {
    return {
      form: {
        id:this.$store.state.users.currentUser.id,
        email:this.$store.state.users.currentUser.email
      },
      error: false,
      success: false,
      waiting: false
    }
  },
  computed: {
    strLogout: function () { return t( 'Esci') }
  },
  methods: {
    t,
    validate,
    call,
    err (msg, extra = false) {
        this.error = this.waiting=false
        setTimeout(()=>this.error = t( msg),1)
        this.$emit("error")
    },
    succ (body) {
      this.waiting=false
      this.success = t( 'Logout avvenuto con successo')
      setTimeout(()=>this.$emit("success"),2000)
      setTimeout(()=>this.$store.dispatch('users/logout', body),2000)
    }
  }
}

</script>

<style scoped>

</style>

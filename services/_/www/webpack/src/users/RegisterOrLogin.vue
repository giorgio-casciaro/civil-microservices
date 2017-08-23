<template>
<div class="RegisterOrLogin">
  <Login v-if="show==='Login'" @success="$emit('loginSuccess')"></Login>
  <Register v-if="show==='Register'"  @success="$emit('registerSuccess')"></Register>
  <div class="toLogin" v-if="show==='Register'">{{strHaveAccount}}<a class="button" @click="show='Login'">{{strLogin}}</a></div>
  <div class="toRegister" v-if="show==='Login'">{{strNotHaveAccount}}<a class="button" @click="show='Register'">{{strRegister}}</a></div>
</div>
</template>
<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'users', string) }
var t= function(string) { return translate( 'users', string) }
import Login from '@/users/Login'
import Register from '@/users/Register'
export default {
  name: 'RegisterOrLogin',
  props:{
    setShow: { type: String },
  },
  components: { Login, Register },
  computed: {
    strHaveAccount: function () { return t('hai già un account?') },
    strLogin: function () { return t('Accedi') },
    strNotHaveAccount: function () { return t('non hai ancora un account?') },
    strRegister: function () { return t('Registrati') },
  },
  methods: { t },
  data() {
    return {
      show: this.setShow||'Register'
    }
  }
}

</script>

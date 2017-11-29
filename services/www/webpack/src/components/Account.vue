<template>
<section class="Account">
  <header>
    <h3 v-html="strTitle" :title="strDescription"></h3>
  </header>
  <div class="body" >
    <div v-if="$store.state.users.logged">
      <User></User>
      <Logout @success="$store.commit('OPEN_VIEWPORT', 'main');$router.push('/')"></Logout>
      <a class="button" @click="$store.commit('OPEN_VIEWPORT', 'main');$router.push('/profile')">profilo</a>
      <Notifications></Notifications>
    </div>
    <div v-if="!$store.state.users.logged">
      <RegisterOrLogin setShow="Login" @loginSuccess="$router.push('/dashboards/')" @registerSuccess="$router.push('/registration/ConfirmEmail/'+$store.state.users.email)"></RegisterOrLogin>
    </div>
    <pre>{{$store.state.users}}</pre>
  </div>
</section>
</template>
<script>
import {translate} from '@/i18n'

import RegisterOrLogin from '@/users/RegisterOrLogin'
import User from '@/users/User'
import Logout from '@/users/Logout'
import Notifications from '@/users/Notifications'
var t= function(string) { return translate( 'app', string) }
export default {
  name: 'Account',
  components: { RegisterOrLogin,User,Notifications ,Logout},
  computed: {
    strTitle: function () { return t('Account') },
    strDescription: function () { return t('Gestisci le tue informazioni personali') },
  },
  methods: {
    t
  }
}
</script>
<style scoped>
.body{overflow: auto;}
</style>

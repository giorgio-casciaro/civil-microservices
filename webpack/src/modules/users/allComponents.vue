<template>
<section class="allComponents">
  <input type="button" value="logout" v-on:click="$store.dispatch('users/logout')" >
  <input type="button" value="reset" v-on:click="$store.dispatch('users/reset')" >
  <ApiView :viewId="$store.state.users.currentUser.id" service="users" :fields="['email','id']">
    <div slot-scope="view">{{view}}</div>
  </ApiView>
  <hr>
  <List></List>
  <hr>
  <Register></Register>
  <hr>
  <ConfirmEmail></ConfirmEmail>
  <hr>
  <Login></Login>
  <hr>
  <ChangePassword></ChangePassword>
  <!--
  <PersonalInfo></PersonalInfo> -->
  <!--<AssignPassword></AssignPassword>
  <hr>
  <ChangePassword></ChangePassword>
  <hr>
  <ConfirmEmail></ConfirmEmail>
<hr>
  <Pic></Pic>
  <hr>
  <PublicName></PublicName>
  <hr>
  <Unregister></Unregister>
  <hr>
  <Logout></Logout>
  <hr>
  <Login></Login>
  <hr> -->
  <!--
  <hr>
  <GuestForm></GuestForm>
  <RegisterOrLogin></RegisterOrLogin>
  <hr>
  <User></User> -->
</section>
</template>
<script>
// import InputDate from '@/modules/users/components/InputDate'
// import PersonalInfo from '@/modules/users/components/PersonalInfo'
// import ChangePassword from '@/modules/users/components/ChangePassword'
// import InputFile from '@/modules/users/components/InputFile'
// import Pic from '@/modules/users/components/Pic'
// import ConfirmEmail from '@/modules/users/components/ConfirmEmail'
// import PublicName from '@/modules/users/components/PublicName'
// import Unregister from '@/modules/users/components/Unregister'
// import GuestForm from '@/modules/users/components/GuestForm'
// import Logout from '@/modules/users/components/Logout'
// import Login from '@/modules/users/components/Login'
// import RegisterOrLogin from '@/modules/users/components/RegisterOrLogin'
// import User from '@/modules/users/components/User'

import ApiView from '@/components/ApiView'

import List from '@/modules/users/components/List'
import Register from '@/modules/users/components/Register'
import AssignPassword from '@/modules/users/components/AssignPassword'
import PersonalInfo from '@/modules/users/components/PersonalInfo'
import ChangePassword from '@/modules/users/components/ChangePassword'
import ConfirmEmail from '@/modules/users/components/ConfirmEmail'
import Login from '@/modules/users/components/Login'

export default {
  mixins: [],
  data() {
    return {
      email: this.$route.params.email
    }
  },
  components: {
    List,
    Register,
    AssignPassword,
    PersonalInfo,
    ChangePassword,
    ConfirmEmail,
    ApiView,
    // Pic,
    // ConfirmEmail,
    Login,
    // PublicName,
    // Unregister,
    // GuestForm,
    // Logout,
    // RegisterOrLogin,
    // User,
    // List
  },
  methods: {
    succ(body) {
      console.log("succ", body)
      // if(body&&body.email)this.email=body.email
      // this.$router.push(url+this.email)
      // this.step=step
    }
  }
}
</script>

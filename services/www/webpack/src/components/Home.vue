<template>
<section class="viewportViewBody Home">
    <img src="../assets/CivilStyle/Images/LogoIconWhite.png" />
    <h1>Civil Connect</h1>
    <p>Crea e organizza la tua community o segui quella più vicina a te.</p>
    <!-- <pre>{{$store.state}}</pre> -->
    <UsersRegisterOrLogin v-if="!$store.state.users.logged" setShow="Register" @loginSuccess="$router.push('/dashboards/')" @registerSuccess="$router.push('/registration/ConfirmEmail/'+$store.state.users.email)"></UsersRegisterOrLogin>
    <DashboardsList></DashboardsList>
    <UserSubscriptions></UserSubscriptions>
    <div><a class="button" href="/#/dashboardCreate">Crea Bacheca</a></div>
</section>
</template>

<script>
import UsersRegisterOrLogin from '@/users/RegisterOrLogin'
import DashboardsList from '@/dashboards/List'
import UserSubscriptions from '@/dashboards/UserSubscriptions'
export default {
  name: 'Home',
  components: {
    UsersRegisterOrLogin,DashboardsList,UserSubscriptions
  },
  data() {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style src="../assets/mapbox-gl.css"></style>
<style scoped>
section.Home {

}
</style>

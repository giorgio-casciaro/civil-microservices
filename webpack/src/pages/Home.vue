<template>
<section class="viewportViewBody Home">
    <img src="../assets/CivilStyle/Images/LogoIconWhite.png" />
    <h1>Civil Connect</h1>
    <p>Crea e organizza la tua community o segui quella più vicina a te.</p>
    <!-- <pre>{{$store.state}}</pre> -->
    <!-- <UsersRegisterOrLogin v-if="!$store.state.users.currentUser.logged" setShow="Register" @loginSuccess="$router.push('/dashboards/')" ></UsersRegisterOrLogin> -->
    <!-- <DashboardsList></DashboardsList> -->
    <!-- <SubscriptionsByUser></SubscriptionsByUser> -->
    <!-- <div><a class="button" href="/#/dashboardCreate">Crea Bacheca</a></div> -->
</section>
</template>

<script>
// import UsersRegisterOrLogin from '@/modules/users/components/RegisterOrLogin'
import pageMixin from './pageMixin'
// import DashboardsList from '@/modules/dashboards/components/List'
// import SubscriptionsByUser from '@/modules/subscriptions/components/ByUser'
export default {
  name: 'Home',
  mixins: [pageMixin],
  components: {
    // UsersRegisterOrLogin,
    // DashboardsList,
    // SubscriptionsByUser
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

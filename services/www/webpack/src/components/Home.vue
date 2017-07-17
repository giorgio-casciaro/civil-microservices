<template>
<section class="Home">
  <img src="../assets/CivilStyle/Images/LogoIconWhite.png"/>
  <h1>Civil Connect</h1>
  <p>Crea e organizza la tua community o segui quella più vicina a te.</p>
  <RegisterOrLogin setShow="Register" @loginSuccess="$router.push('/dashboards/')" @registerSuccess="$router.push('/registration/ConfirmEmail/'+$store.state.users.email)"></RegisterOrLogin>
</section>
</template>

<script>
import RegisterOrLogin from '@/users/RegisterOrLogin'
export default {
  name: 'Home',
  components: { RegisterOrLogin },
  data() {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

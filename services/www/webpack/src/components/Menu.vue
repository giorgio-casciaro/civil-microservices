<template>
<section class="Menu">
  <header>
    <form class="search container ">
      <input class="search input main" placeholder="Cerca" />
      <a class="search button reset">X</a>
      <a class="search button ok">Ok</a>
    </form>
  </header>
  <ul>
    <li><router-link to="/" >Home</router-link></li>
    <li><router-link to="/registration" >Registrazione</router-link></li>
    <li><router-link to="/login" >Login</router-link></li>
    <li><router-link to="/profile" >Profilo</router-link></li>
    <li><router-link to="/dashboards" >Dashboards</router-link></li>
  </ul>
</section>
</template>

<script>
export default {
  name: 'Menu',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/*h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}*/
</style>

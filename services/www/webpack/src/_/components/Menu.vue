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
    <li><a href="https://vuejs.org" target="_blank">Chi siamo</a></li>
    <li><a href="https://forum.vuejs.org" target="_blank">Supporto</a></li>
    <br>
    <li><a href="http://vuejs-templates.github.io/webpack/" target="_blank">Docs for This Template</a></li>
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

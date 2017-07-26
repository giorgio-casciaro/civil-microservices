<template>
<div id="app">
  <div class="main viewportView" v-bind:class="'viewport_'+$store.state.viewport">
    <header>
      <div class="left">
        <a id="menuBtn" class="menu button" v-on:click="$store.commit('OPEN_VIEWPORT', 'menu')">Menu</a>
      </div>
      <div class="center">
        <h1>Civil Connect</h1>
        <a href="#/"><img src="./assets/CivilStyle/Images/LogoText.png" v-on:click="$store.commit('OPEN_VIEWPORT', 'main')"></a>
      </div>
      <div class="right">
        <a id="accountBtn" class="map button" v-on:click="$store.commit('OPEN_VIEWPORT', 'map')">Map</a>
        <a id="accountBtn" class="account button" v-on:click="$store.commit('OPEN_VIEWPORT', 'account')">Account</a>
      </div>
    </header>
    <div id='map' style='width: 400px; height: 300px;'></div>
    <!-- <img src="./assets/logo.png"> -->
    <transition name="slide-fade">

    <router-view></router-view>
    </transition>
  </div>
  <router-view class="menu viewportView" name="menu" v-bind:class="$store.state.viewport==='menu' ? 'active' : 'notActive'"></router-view>
  <router-view class="map viewportView  hide" name="map" v-bind:class="$store.state.viewport==='map' ? 'active' : 'notActive'"></router-view>
  <router-view class="account viewportView  hide" name="account" v-bind:class="$store.state.viewport==='account' ? 'active' : 'notActive'"></router-view>
</div>
</template>

<script >
const mapboxgl=require("mapbox-gl")
const style=require("./assets/mapstyle")

export default {
  name: 'app',
  mounted(){
    // mapboxgl.accessToken = 'pk.eyJ1Ijoic2ludGJpdCIsImEiOiJjajIzMnk3NDUwMDExMnlvNzc2MXk2dXNuIn0.fmB5CPQudFNP9CqssSHG9g';
    var map = new mapboxgl.Map({
        container: 'map',
        style
    });
  },
  methods: {

  }
}
</script>
<style src="./assets/mapbox-gl.css"></style>
<style src="./assets/reset.css"></style>
<style src="./assets/style.css"></style>
<style scoped>
/* HEADER */
header {
  background: #444;
  display: flex;
}
header>.button {
  display: inline-block;
}
header>.left {
  flex-basis: 20%
}
header>.center {
  flex-grow: 1;
  text-align: center;
}
header>.right {
  text-align: right;
  flex-basis: 20%
}

/* VIEWPORT */
.viewportView {
  background: #ccc;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  transition: left .5s, right .5s
}

/* VIEWPORT MENU */
.menu.viewportView {
  width: 90vw;
  left: -90vw
}

.menu.viewportView.active {
  left: 0
}

.main.viewportView.viewport_menu {
  left: 90vw;
  right: -90vw;
}


/* ACCOUNT */

.account.viewportView {
  width: 90vw;
  right: -90vw;
  left: auto
}

.account.viewportView.active {
  right: 0
}

.main.viewportView.viewport_account {
  right: 90vw;
  left: -90vw;
}
</style>

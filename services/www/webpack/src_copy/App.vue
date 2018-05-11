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

  },
  methods: {

  }
}
</script>
<style src="./assets/reset.css"></style>
<style src="./assets/style.css"></style>

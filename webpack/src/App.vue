<template>
<div id="app" v-bind:class="'viewport_'+$store.state.viewport" v-bind:viewport="$store.state.viewport">
  <div class="main viewportView" >
    <header>
      <router-link to="/"><img src="./assets/CivilStyle/Images/LogoText.png"></router-link>
      <a v-on:click="$store.commit('VIEWPORT', 'menu')" >Menu</a>
      <a v-on:click="$store.commit('VIEWPORT', 'map')">Map</a>
      <a v-on:click="$store.commit('VIEWPORT', 'account')">Account</a>
    </header>
    <!-- <img src="./assets/logo.png"> -->
    <transition name="slide-fade">
    <router-view></router-view>
    </transition>
  </div>
  <router-view class="menu viewportView" name="menu" ></router-view>
  <router-view class="map viewportView  hide" name="map" ></router-view>
  <router-view class="account viewportView  hide" name="account" ></router-view>
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

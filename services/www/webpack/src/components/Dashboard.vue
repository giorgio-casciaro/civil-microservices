<template>
<section class="viewportViewBody Dashboard">
  <!-- <pre>{{userSubscription}}</pre>
  <pre>{{userRole}}</pre> -->
  <div v-if="dashId&&dashboard">
    <h3>{{dashboard.name}} - {{strTitle}} <a v-if="can('writeDashboard')" class="button" :href="'/#/dashboardEdit/'+dashId">Opzioni Bacheca</a> <a v-if="can('readSubscriptions')" class="button" :href="'/#/dashboardSubscriptions/'+dashId">Iscrizioni</a></h3>
    <!-- <p v-html="strDescription"></p> -->
    <a @click="showNewPost=!showNewPost">{{strNewPost}}</a>
    <div v-if="showNewPost">
      <a @click="showNewPost=0">{{strNewPostClose}}</a>
      <DashboardPostCreate :dashId="dashId"></DashboardPostCreate>
    </div>
    <div id='dashboardMap' style='width: 400px; height: 300px;'></div>
    <PostsList :dashId="dashId"></PostsList>
  </div>
</section>
</template>

<script>
import {translate } from '@/i18n'
import DashboardPostCreate from '@/dashboards/PostCreate'
import PostsList from '@/dashboards/PostsList'
import Vue from 'vue'

const mapboxgl = require("mapbox-gl")
const style = require("../assets/mapstyle")
var map

export default {
  name: 'Dashboard',
  mounted() {
    if (this.dashboard) {
      this.$nextTick(function () {
       this.mapMount()
     })
    }
  },
  watch: {
    dashboard: function (val) {
      this.$nextTick(function () {
       this.mapMount()
     })
    }
  },
  components: {
    DashboardPostCreate,
    PostsList
  },
  computed: {
    strTitle: function() {
      return translate('dashboards', 'Messaggi')
    },
    dashId: function() {
      return parseInt(this.$route.params.dashId)
    },
    userSubscription: function() {
      return this.$store.state.dashboards.userSubscriptionsByDashboardId[this.dashId]||{roleId:"guest"}
    },
    userRole: function() {
      if(this.userSubscription&&this.dashboard)return this.dashboard.roles[this.userSubscription.roleId]
    },
    dashboard: function() {
      if(!this.$store.state.dashboards.dashboardsById[this.dashId])this.$store.dispatch('dashboards/loadDashboard', this.dashId)
      return this.$store.state.dashboards.dashboardsById[this.dashId]
    },
    strNewPost: function () { return translate('dashboards', 'Nuovo Post') },
    strNewPostClose: function () { return translate('dashboards', 'Close') }
  },
  methods: {
    can(permission){
      if(this.userRole&&this.userRole.permissions)return this.userRole.permissions.indexOf(permission)+1
      return false
    },
    mapMount() {
      // mapboxgl.accessToken = 'pk.eyJ1Ijoic2ludGJpdCIsImEiOiJjajIzMnk3NDUwMDExMnlvNzc2MXk2dXNuIn0.fmB5CPQudFNP9CqssSHG9g';
      var mapInfo = {
        centerLng: 12.73931877340101,
        centerLat: 42.42996538898933,
        zoom: 4
      }
      // if(this.$route.params.dashId&&!this.dashId)this.dashId=this.$route.params.dashId
      if (this.dashboard.maps) {
        // this.form = this.$store.state.dashboards.dashboard
        mapInfo = this.dashboard.maps[this.activeMap]
      }
      var url = "/styles/osm-bright/style.json"
      var dashId = this.dashId
      // console.log("mapstyle new", style)
      map = new mapboxgl.Map({
        container: 'dashboardMap',
        center: [mapInfo.centerLng, mapInfo.centerLat],
        style: style,
        zoom: mapInfo.zoom,
        interactive: true
      });
      // Vue.set(this.$store.state.dashboards.dashboardsMaps, dashId, map)
      this.$store.dispatch("dashboards/setDashboardActiveMap",{map,dashId,mapInfo})
      this.mapMounted=true
    },
    t(string) {
      return translate('app', string)
    }
  },
  data() {
    return {
      showNewPost:false,
      activeMap:0
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

<template>
<section class="viewportViewBody Dashboard">
  <!-- <pre>{{userSubscription}}</pre>
  <pre>{{userRole}}</pre> -->
  <div v-if="dashId&&dashboard">
    <!-- <h3>{{dashboard.name}} - {{strTitle}} <a v-if="can('writeDashboard')" class="button" :href="'/#/dashboardEdit/'+dashId">Opzioni Bacheca</a> <a v-if="can('readSubscriptions')" class="button" :href="'/#/dashboardSubscriptions/'+dashId">Iscrizioni</a></h3> -->
    <!-- <p v-html="strDescription"></p> -->
    <DashboardMenu :dashboard="dashboard"></DashboardMenu>
    <div id='dashboardMap' style='width: 400px; height: 300px;'></div>
    <div class="menu"><a @click="showNewPost=!showNewPost">{{strNewPost}}</a> <a @click="show='PostsList'" >Ultimi messaggi</a> <a @click="show='PostsToConfirmList'" >Messaggi da confermare <i>({{this.dashboard.postsToConfirmMeta.length}})</i></a></div>
    <div v-if="showNewPost">
      <a @click="showNewPost=0">{{strNewPostClose}}</a>
      <DashboardPostCreate :dashId="dashId"></DashboardPostCreate>
    </div>
    <PostsList v-if="show==='PostsList'" :dashId="dashId"></PostsList>
    <PostsToConfirmList v-if="show==='PostsToConfirmList'" :dashId="dashId"></PostsToConfirmList>
  </div>
</section>
</template>

<script>
import DashboardPostCreate from '@/dashboards/PostCreate'
import DashboardMenu from '@/dashboards/Menu'
import PostsList from '@/dashboards/PostsList'
import PostsToConfirmList from '@/dashboards/PostsToConfirmList'
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
    PostsList,
    PostsToConfirmList,
    DashboardMenu
  },
  computed: {
    strTitle: function() {
      return this.t('Messaggi')
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
      this.$store.dispatch('dashboards/loadDashboard', {dashId: this.dashId})
      return this.$store.getters["dashboards/getDashboard"](this.dashId)
    },
    strNewPost: function () { return this.t( 'Nuovo Post') },
    strNewPostClose: function () { return this.t( 'Close') }
  },
  methods: {
    can(permission){return this.$store.getters['dashboards/can'](this.dashId, permission)},
    mapMount() {
      var mapInfo = {
        centerLng: 12.73931877340101,
        centerLat: 42.42996538898933,
        zoom: 4
      }
      if (this.dashboard.maps) {
        mapInfo = this.dashboard.maps[this.activeMap]
      }
      var url = "/styles/osm-bright/style.json"
      var dashId = this.dashId
      map = new mapboxgl.Map({
        container: 'dashboardMap',
        center: [mapInfo.centerLng, mapInfo.centerLat],
        style: style,
        zoom: mapInfo.zoom,
        interactive: true
      });
      this.$store.dispatch("dashboards/setDashboardActiveMap",{map,dashId,mapInfo})
      this.mapMounted=true
    },
    t(string) {
      return this.$store.getters['dashboards/t'](string)
    },
  },
  data() {
    return {
      showNewPost:false,
      show:"PostsList",
      activeMap:0
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

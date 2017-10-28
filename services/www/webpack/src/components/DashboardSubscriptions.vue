<template>
<section class="viewportViewBody DashboardSubscriptions">
  <!-- <pre>{{dashboard}}</pre> -->
  <div v-if="dashId&&dashboard">
    <h3>{{dashboard.name}} - {{strTitle}} <a class="button" :href="'/#/dashboardEdit/'+dashId">Opzioni Bacheca</a> <a class="button" :href="'/#/dashboard/'+dashId">Messaggi</a></h3>
    <SubscriptionsList :dashId="dashId" ></SubscriptionsList>
  </div>
</section>
</template>

<script>
import {translate } from '@/i18n'
import SubscriptionsList from '@/dashboards/SubscriptionsList'
import Vue from 'vue'

export default {
  name: 'DashboardSubscriptions',
  components: {
    SubscriptionsList
  },
  computed: {
    strTitle: function() {
      return translate('dashboards', 'Iscrizioni')
    },
    dashId: function() {
      return parseInt(this.$route.params.dashId)
    },
    // subscription: function() {
    //   return this.$store.state.dashboards.subscriptionsByDashboardId[this.dashId]
    // },
    dashboard: function() {
      if(!this.$store.state.dashboards.dashboardsById[this.dashId])this.$store.dispatch('dashboards/loadDashboard', this.dashId)
      return this.$store.state.dashboards.dashboardsById[this.dashId]
    },
    strNewPost: function () { return translate('dashboards', 'Nuovo Post') },
    strNewPostClose: function () { return translate('dashboards', 'Close') }
  },
  methods: {
    t(string) {
      return translate('app', string)
    }
  },
  data() {
    return {
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

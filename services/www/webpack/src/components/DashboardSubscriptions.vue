<template>
<section class="viewportViewBody DashboardSubscriptions">
  <!-- <pre>{{dashboard}}</pre> -->
  <div v-if="dashId&&dashboard">
    <DashboardMenu :dashboard="dashboard"></DashboardMenu>
    <div class="menu"><a @click="show='SubscriptionsList'" >Ultime iscrizioni</a> <a @click="show='SubscriptionsToConfirmList'" >Iscrizioni da confermare <i>({{this.dashboard.subscriptionsToConfirmMeta.length}})</i></a></div>
    <SubscriptionsList  v-if="show==='SubscriptionsList'"  :dashId="dashId" ></SubscriptionsList>
    <SubscriptionsToConfirmList  v-if="show==='SubscriptionsToConfirmList'"  :dashId="dashId" ></SubscriptionsToConfirmList>
  </div>
</section>
</template>

<script>
import {translate } from '@/i18n'
import SubscriptionsList from '@/dashboards/SubscriptionsList'
import SubscriptionsToConfirmList from '@/dashboards/SubscriptionsToConfirmList'
import DashboardMenu from '@/dashboards/Menu'

import Vue from 'vue'

export default {
  name: 'DashboardSubscriptions',
  components: {
    SubscriptionsList,DashboardMenu,SubscriptionsToConfirmList
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
      if(!this.$store.state.dashboards.dashboardsById[this.dashId])this.$store.dispatch('dashboards/loadDashboard', {dashId:this.dashId})
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
      show:"SubscriptionsList"
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

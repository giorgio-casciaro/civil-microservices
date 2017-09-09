<template>
<section class="viewportViewBody Dashboard">
  <h3 >{{strTitle}} {{dashboard.name}} <a class="button" :href="'/#/dashboardEdit/'+dashId">edit</a></h3>
  <!-- <p v-html="strDescription"></p> -->
  <div v-if="dashId&&dashboard">
    <DashboardPostCreate :dashId="dashId"></DashboardPostCreate>
    <DashboardPostsList :dashId="dashId"></DashboardPostsList>
    <DashboardSubscriptionsList :dashId="dashId"></DashboardSubscriptionsList>
  </div>
</section>
</template>

<script>
import {translate} from '@/i18n'
import DashboardPostCreate from '@/dashboards/PostCreate'
import DashboardPostsList from '@/dashboards/PostsList'
import DashboardSubscriptionsList from '@/dashboards/SubscriptionsList'

export default {
  name: 'Dashboard',
  components: {DashboardPostCreate,DashboardPostsList,DashboardSubscriptionsList},
  computed: {
    strTitle: function () { return translate('app', 'Bacheca') },
    dashId: function () { return  parseInt(this.$route.params.dashId) },
    dashboard: function () { return  this.$store.state.dashboards.dashboardsById[this.dashId] },
    // strDescription: function () { return translate('app', 'iscriviti ad una bacheca per ricevere notifiche in tempo reale') }
  },
  methods: {
    t (string) { return translate('app', string) }
  },
  // data() {
  //   return {
  //     dashId:
  //   }
  // },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

<template>
<div class="DashboardSubscriptionsList">
  <div v-if="subscriptions.items">
    <div v-for="(id, index) in subscriptions.items">
      <SingleSubscription :subscriptionId="id"></SingleSubscription>
    </div>
  </div>
  <div v-if="!subscriptions.items">
    Non ci sono messagi in questa bacheca
  </div>
  <div><a class="button" @click="reload">{{strReload}}</a></div>
  <div><a class="button" @click="loadMore">{{strLoadMore}}</a></div>
</div>
</template>
<script>
import SingleSubscription from '@/dashboards/SingleSubscription'
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'DashboardSubscriptionsList',
  props: {"dashId":Number},
  created() {
    // this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId })
  },
  mounted() {
    this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId })
  },
  components: { SingleSubscription },
  computed: {
    strLoadMore: function () { return t('Load More') },
    strReload: function () { return t('Refresh') },
    subscriptions: function () {
      return this.$store.state.dashboards.dashboardsSubscriptionsList[this.dashId]||{}
    }
  },
  methods: {
    t(string) {
      return this.$store.getters['dashboards/t'](string)
    },
    loadMore(){
      this.$store.dispatch("dashboards/lastDashboardSubscriptionsLoadMore",{ dashId:this.dashId })
    },
    reload(){
      this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId})
    }
  },
  data() {
    return {
      // show: this.setShow||'Register'
    }
  }
}

</script>

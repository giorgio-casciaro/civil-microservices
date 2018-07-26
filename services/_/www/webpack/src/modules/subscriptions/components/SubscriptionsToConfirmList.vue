<template>
<div class="DashboardSubscriptionsToConfirmList">
  <div v-for="(id, index) in subscriptions">
    <SingleSubscription :subscriptionId="id"></SingleSubscription>
  </div>
</div>
</template>
<script>
import SingleSubscription from '@/dashboards/SingleSubscription'
export default {
  name: 'DashboardSubscriptionsToConfirmList',
  props: {"dashId":Number},
  created() {
    // this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId })
  },
  components: { SingleSubscription },
  computed: {
    dashboard: function() {
      return this.$store.getters["dashboards/getDashboard"](this.dashId)
    },
    subscriptions: function() {
      return this.dashboard.subscriptionsToConfirmMeta||[]
    }
  },
  methods: {
    t(string) {
      return this.$store.getters['dashboards/t'](string)
    },
  },
  data() {
    return {
      // show: this.setShow||'Register'
    }
  }
}

</script>

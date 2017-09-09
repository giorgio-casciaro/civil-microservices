<template>
<div class="SingleSubscription">
SingleSubscription
{{dashId}}
{{userId}}
<pre>{{subscription}}</pre>
</div>
</template>
<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'SingleSubscription',
  props: {"subscriptionId":String},
  // created() {
  //   this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId })
  // },
  components: {  },
  computed: {
    // strDashboardSubscriptionsList: function () { return t('Lista Subscriptions') },
    // strLoadMore: function () { return t('Load More') },
    // strReload: function () { return t('Refresh') },
    subscription: function () { return this.$store.state.dashboards.subscriptionsById[this.subscriptionId]}
  },
  methods: {
    t
  },
  data() {
    return {
      // show: this.setShow||'Register'
    }
  }
}

</script>

<template>
<div class="DashboardSubscriptionsList">
  {{dashId}}
  <!-- <div v-if="dashId&&posts"> -->
  {{subscriptions}}
  <!-- </div> -->
  <!-- <Login v-if="show==='Login'" @success="$emit('loginSuccess')"></Login>
  <Register v-if="show==='Register'"  @success="$emit('registerSuccess')"></Register>
  <div class="toLogin" v-if="show==='Register'">{{strHaveAccount}}<a class="button" @click="show='Login'">{{strLogin}}</a></div>
  <div class="toRegister" v-if="show==='Login'">{{strNotHaveAccount}}<a class="button" @click="show='Register'">{{strRegister}}</a></div> -->
  <div><a class="button" @click="reload">{{strReload}}</a></div>
  <div><a class="button" @click="loadMore">{{strLoadMore}}</a></div>
</div>
</template>
<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'DashboardSubscriptionsList',
  props: {"dashId":Number},
  created() {
    this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId })
  },
  components: {  },
  computed: {
    strDashboardSubscriptionsList: function () { return t('Lista Subscriptions') },
    strLoadMore: function () { return t('Load More') },
    strReload: function () { return t('Refresh') },
    subscriptions: function () { return this.$store.state.dashboards.listSubscriptions[this.dashId]}
  },
  methods: {
    t,
    loadMore(){
      this.$store.dispatch("dashboards/lastDashboardSubscriptionsLoadMore",{ dashId:this.dashId })
    },
    reload(){
      this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId })
    }
  },
  data() {
    return {
      // show: this.setShow||'Register'
    }
  }
}

</script>

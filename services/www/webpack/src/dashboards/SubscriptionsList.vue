<template>
<div class="DashboardSubscriptionsList">
  {{dashId}}
  <!-- <div v-if="dashId&&posts"> -->
  <div v-for="(subscription, index) in subscriptions">
    <!-- {{post}} -->
    <!-- <h4>{{subscription.role}}</h4> -->
    <!-- <h3>{{post.name}}</h3> -->
    <!-- <div class="from"></div>
    <div class="tags">
      <span v-for="(item, index) in post.tags">
        #{{ item }}
      </span>
    </div>
    <div class="body">{{post.body}}</div> -->
    <SingleSubscription :subscription="subscription"></SingleSubscription>
    <!-- <a class="button" :href="'/#/dashboard/'+subscription.dashInfo.id">{{strEnter}}</a> -->
    <!-- <pre>{{post}}</pre> -->
  </div>
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
import SingleSubscription from '@/dashboards/SingleSubscription'
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'DashboardSubscriptionsList',
  props: {"dashId":Number},
  created() {
    // this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId })
  },
  components: { SingleSubscription },
  computed: {
    strDashboardSubscriptionsList: function () { return t('Lista Subscriptions') },
    strLoadMore: function () { return t('Load More') },
    strReload: function () { return t('Refresh') },
    subscriptions: function () {
      if(this.$store.state.dashboards.dashboardsSubscriptionsList[this.dashId])return this.$store.state.dashboards.dashboardsSubscriptionsList[this.dashId]
      else this.$store.dispatch("dashboards/lastDashboardSubscriptions",{ dashId:this.dashId })
    }
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

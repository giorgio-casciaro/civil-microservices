<template>
<div class="SingleSubscription">
<!-- <div class="user" >{{strCreatedBy}} <a class="username">{{subscription.user.publicName}}</a> <span class="role" :title="role.description">{{role.name}}</span></div>
 <div class="created">{{strCreatedDate}} {{toDate(subscription.created)}}</div>
<div class="updated" v-if="subscription.updated!==subscription.created">{{strUpdatedDate}} {{toDate(subscription.updated)}}</div>
<div class="tags">
  <span v-for="(item, index) in subscription.tags"> #{{ item }} </span>
</div>
<div><a @click="edit_mode=!edit_mode">Edit</a></div>
<h4>{{subscription.name}}</h4>
<div class="body">{{subscription.body}}</div>

<div v-if="edit_mode">
  <SingleSubscriptionEdit :subscription="subscription" :dashId="subscription.dashId"></SingleSubscriptionEdit>
</div> -->
<pre>{{subscription}}</pre>
<!--<pre>{{role}}</pre>
<pre>{{subscription}}</pre>
<pre>{{user}}</pre> -->
</div>
</template>
<script>
import SingleSubscriptionEdit from '@/dashboards/SingleSubscriptionEdit'
var moment = require('moment');
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
const mapboxgl = require("mapbox-gl")

export default {
  name: 'SingleSubscription',
  props: {"subscription":Object,"show":String},
  components: {  SingleSubscriptionEdit },
  computed: {
    // subscription: function () { return this.$store.state.dashboards.extendedSubscriptionsById[this.subscription.subscriptionId]},
    role: function () {
      if(this.$store.state.dashboards.dashboardsById[this.subscription.dashId])return this.$store.state.dashboards.dashboardsById[this.subscription.dashId].roles[this.subscription.subscription.roleId]
      else this.$store.dispatch("dashboards/loadDashboard",this.subscription.dashId)
    },
    // user: function () { return this.$store.state.users.usersById[this.subscription.userId]},
    strCreatedBy: function() { return t('Creato da') },
    strCreatedDate: function() { return t('Creato') },
    strUpdatedDate: function() { return t('Aggiornato') },
    map: function() { return this.$store.state.dashboards.dashboardsMaps[this.subscription.dashId][0]},
    location: function() { return this.subscription.location },
  },
  mounted() {
    if(this.subscription.location&&this.subscription.location[0])this.$store.dispatch("dashboards/addDashboardMapPoint",{id:this.subscription.id+"_0",dashId:this.subscription.dashId,lat:this.subscription.location[0].lat,lng:this.subscription.location[0].lng})
  },
  methods: {
    t,
    toDate(timestamp,format) {
      moment.locale('it');
      return moment(parseInt(timestamp)).format(format||"dddd, D MMMM YYYY, h:m:s")
    },
  },
  data() {
    return {
      edit_mode: false
    }
  }
}

</script>

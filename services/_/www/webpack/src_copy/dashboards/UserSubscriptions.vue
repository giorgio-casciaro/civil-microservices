<template>
<div v-if="$store.state.dashboards.userSubscriptions" class="UserSubscriptionsList">
  <h3>{{strSubscriptionsList}}</h3>
  <div v-for="(subscription, index) in $store.state.dashboards.userSubscriptions">
    {{subscription}}
    <h4>{{subscription.role}}</h4>
    <h3>{{subscription.dashInfo.name}}</h3>
    <div v-if="subscription.dashInfo.pics&&subscription.dashInfo.pics[0]" class="image"><img :src="`${$store.state.apiServer}/dashboards/getPic/id/${subscription.dashInfo.pics[0]}`" /></div>
    <div class="tags">{{subscription.dashInfo.tags.join(",")}}</div>
    <a class="button" :href="'/#/dashboard/'+subscription.dashInfo.id">{{strEnter}}</a>
    <!-- <pre>{{subscription}}</pre> -->
  </div>
  <!-- <pre>{{$store.state.dashboards.subscriptions}}</pre> -->
</div>
</template>
<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'UserSubscriptionsList',
  props:{
    // setShow: { type: String },
  },
  components: {  },
  computed: {
    strSubscriptionsList: function () { return t('Le tue iscrizioni') },
    strEnter: function () { return t('Entra') }
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

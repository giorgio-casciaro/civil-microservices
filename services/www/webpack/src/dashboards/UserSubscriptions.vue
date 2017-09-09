<template>
<div v-if="$store.state.dashboards.subscriptions" class="SubscriptionsList">
  <h3>{{strSubscriptionsList}}</h3>
  <div v-for="(subscription, index) in $store.state.dashboards.subscriptions">
    <h4>{{subscription.role}}</h4>
    <h3>{{subscription.dashInfo.name}}</h3>
    <div class="tags">{{subscription.dashInfo.tags.join(",")}}</div>
    <a class="button" :href="'/#/dashboard/'+subscription.dashInfo.id">{{strEnter}}</a>
  </div>
  <!-- <pre>{{$store.state.dashboards.subscriptions}}</pre> -->
</div>
</template>
<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'SubscriptionsList',
  props:{
    // setShow: { type: String },
  },
  components: {  },
  computed: {
    strSubscriptionsList: function () { return t('Lista Sottoscrizioni') },
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

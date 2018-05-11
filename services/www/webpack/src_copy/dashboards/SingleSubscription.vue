<template>
<div class="SingleSubscription">
<div v-if="subscription.user" class="user">
  <div ><a  v-if="!subscription._confirmed" class="button" @click="confirm()">Confirm</a><a class="button" v-if="can('writeSubscriptions')" @click="edit_mode=!edit_mode">Edit</a></div>
  <div v-if="edit_mode">
    <SingleSubscriptionEdit :subscription="subscription" :dashId="subscription.dashId" ></SingleSubscriptionEdit>
  </div>
  <a class="username">{{subscription.user.publicName}}</a> <span class="role" :title="role.description">{{role.name}}</span>
  <div v-if="subscription.user._confirmed">Utente da confermare</div>
</div>
  <!-- <pre>{{subscription}}</pre> -->
</div>
</template>
<script>
import SingleSubscriptionEdit from '@/dashboards/SingleSubscriptionEdit'

export default {
  name: 'SingleSubscription',
  props: {
    "subscriptionId": String
  },
  components: {
    SingleSubscriptionEdit
  },
  computed: {
    role: function() {
      return this.$store.getters['dashboards/getRole'](this.subscription.dashId, this.subscription.roleId)
    },
    subscription: function () {
      this.$store.dispatch('dashboards/loadSubscription', {subscriptionId:this.subscriptionId})
      return this.$store.getters['dashboards/getSubscription'](this.subscriptionId)
    }
  },
  mounted() {},
  methods: {
    t(string) {
      return this.$store.getters['dashboards/t'](string)
    },
    can(permission) {
      return this.$store.getters['dashboards/can'](this.subscription.dashId, permission)
    },
    toDate(timestamp, format) {
      return this.$store.getters['toDate'](timestamp, format)
    },
  },
  data() {
    return {
      edit_mode: false
    }
  }
}
</script>

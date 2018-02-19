<template>
<div> test
  <div v-if="dashboard" class="DashboardMenu">
    <h3>{{dashboard.name}} - {{strTitle}} <a class="button" :href="'/#/dashboard/'+dashboard.id">Messaggi</a> <a v-if="can('subscriptionsReads')" class="button" :href="'/#/dashboardSubscriptions/'+dashboard.id">Iscrizioni</a> <a v-if="can('writeDashboard')" class="button" :href="'/#/dashboardEdit/'+dashboard.id">Opzioni Bacheca</a></h3>
  </div>
</div>
</template>

<script type="text/javascript">
export default {
  name: 'DashboardMenu',
  props: {
    'dashboard': Object,
    strTitle: String
  },
  // data() {
  //   return {
  //
  //   }
  // },
  methods: {
    can(permission) {
      if (this.dashboard) return this.$store.getters['dashboards/can'](this.dashboard.id, permission)
    },
  }
}
</script>

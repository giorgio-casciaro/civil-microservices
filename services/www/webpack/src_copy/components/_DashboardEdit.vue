<template>
<section class="viewportViewBody DashboardEdit">
  <div v-if="$store.state.users.logged">
    <h3>{{strTitle}} {{dashboard.name}}</h3>
    <p>{{strDescription}}</p>
    <DashboardsEditForm :dashId="dashId"></DashboardsEditForm>
  </div>
</section>
</template>

<script language="javascript">
import { translate } from '@/i18n'
import DashboardsEditForm from '@/dashboards/Edit'

var t = function(string) {
  return translate('dashboards', string)
}

export default {
  name: 'DashboardsEdit',
  components: {
    DashboardsEditForm
  },
  computed: {
    strTitle: function () { return translate('app', 'Bacheca') },
    strDescription: function () { return translate('app', 'Compila il form per modificare la tua bacheca') },
    dashId: function () { return  parseInt(this.$route.params.dashId) },
    dashboard: function () { return  this.$store.state.dashboards.dashboardsById[this.dashId] },
    // strDescription: function () { return translate('app', 'iscriviti ad una bacheca per ricevere notifiche in tempo reale') }
  },
  created() {
    if (!this.$store.state.users.logged) this.$router.push('/')
  },
  data() {
    return {
      str: {
        title: t('Modifica Bacheca'),
        description: t('Modifica la tua Bacheca')
      }
    }
  },
  methods: {
    t
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

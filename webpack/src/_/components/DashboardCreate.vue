<template>
<section class="viewportViewBody DashboardCreate">
  <div v-if="$store.state.users.logged">
    <h3 v-html="str.title"></h3>
    <p v-html="str.description"></p>
    <DashboardsCreateForm :dashId="dashId"></DashboardsCreateForm>
  </div>
</section>
</template>

<script language="javascript">
import { translate } from '@/translations'
import DashboardsCreateForm from '@/dashboards/Edit'

var t = function(string) {
  return translate('dashboards', string)
}

export default {
  name: 'DashboardsCreate',
  components: {
    DashboardsCreateForm
  },
  created() {
    if (!this.$store.state.users.logged) this.$router.push('/')
  },
  data() {
    return {
      str: {
        title: t('Nuova Bacheca'),
        description: t('Crea una nuova Bacheca')
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

<template>
<section class="MyDashboards">
  <header>
    <h3 v-html="getter_t('Le mie bacheche')"></h3>
    <p v-html="getter_t('di seguito le bacheche alle quali sei iscritto')"></p>
  </header>
</section>
</template>
<script>
// import Login from '@/modules/users/components/Login'
import pageMixin from './pageMixin'

export default {
  mixins: [pageMixin],
  data() {
    return {}
  },
  components: {
    Login
  },
  methods: {

  }
}
</script>

<template>
<section class="viewportViewBody Dashboards">
  <div>
    <h3 v-html="strTitle"></h3>
    <p v-html="strDescription"></p>
  </div>
</section>
</template>

<script>
import {
  translate
} from '@/translations'

export default {
  name: 'Dashboards',
  // components: {Login},
  computed: {
    strTitle: function() {
      return translate('app', 'Bacheche')
    },
    strDescription: function() {
      return translate('app', 'iscriviti ad una bacheca per ricevere notifiche in tempo reale')
    }
  },
  methods: {
    t(string) {
      return translate('app', string)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

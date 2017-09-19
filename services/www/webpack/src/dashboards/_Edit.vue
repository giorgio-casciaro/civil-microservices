<template>
<div class="DashboardEdit">
</div>
</template>
<script>

import { translate } from '@/i18n'
var t = function(string) {
  return translate('dashboards', string)
}

export default {
  name: 'DashboardsEdit',
  props: {
    "dashId": Number
  },
  components: {},
  methods: {
    t,
    validate,
    call
  },
  data() {

  }
}
</script>

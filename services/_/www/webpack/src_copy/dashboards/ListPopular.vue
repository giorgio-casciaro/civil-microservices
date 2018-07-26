<template>
<div class="DashboardsListPopular">
  {{strPopularDashboards}}
  
  <!-- <Login v-if="show==='Login'" @success="$emit('loginSuccess')"></Login>
  <Register v-if="show==='Register'"  @success="$emit('registerSuccess')"></Register>
  <div class="toLogin" v-if="show==='Register'">{{strHaveAccount}}<a class="button" @click="show='Login'">{{strLogin}}</a></div>
  <div class="toRegister" v-if="show==='Login'">{{strNotHaveAccount}}<a class="button" @click="show='Register'">{{strRegister}}</a></div> -->
</div>
</template>
<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'DashboardsListPopular',
  props:{
    // setShow: { type: String },
  },
  components: {  },
  computed: {
    strPopularDashboards: function () { return t('Dashboard più popolari') }
  },
  methods: { t },
  data() {
    return {
      // show: this.setShow||'Register'
    }
  }
}

</script>

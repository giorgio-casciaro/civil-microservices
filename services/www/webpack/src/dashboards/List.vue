<template>
<div class="DashboardsList">
  <h3>{{strDashboardsList}}</h3>
  <div v-for="(dashboard, index) in dashboards">
    <h4>{{dashboard.name}}</h4>
    <div class="tags">{{dashboard.tags.join(",")}}</div>
    <p>{{dashboard.description}}</p>
    <a v-if="getSubscription(dashboard.id)" class="button" :href="'/#/dashboard/'+dashboard.id">{{strEnter}}</a>
    <a v-if="!getSubscription(dashboard.id)&&parseInt(dashboard.public)===1" class="button" :href="'/#/dashboard/'+dashboard.id">{{strRegister}}</a>
    <a v-if="!getSubscription(dashboard.id)&&parseInt(dashboard.public)===0" class="button" :href="'/#/dashboard/'+dashboard.id">{{strRegisterRequest}}</a>
  </div>
  <!-- <Login v-if="show==='Login'" @success="$emit('loginSuccess')"></Login>
  <Register v-if="show==='Register'"  @success="$emit('registerSuccess')"></Register>
  <div class="toLogin" v-if="show==='Register'">{{strHaveAccount}}<a class="button" @click="show='Login'">{{strLogin}}</a></div>
  <div class="toRegister" v-if="show==='Login'">{{strNotHaveAccount}}<a class="button" @click="show='Register'">{{strRegister}}</a></div> -->
  <div><a class="button" @click="loadMore">{{strLoadMore}}</a></div>
</div>
</template>
<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'DashboardsList',
  props:{
    // setShow: { type: String },
  },
  created(){
    this.$store.dispatch("dashboards/lastDashboards")
    // call('dashboards', 'queryLastDashboards', {from: 0, to: pageLength}, (payload) => store.commit('DASHBOARDS_LIST', payload))
  },
  components: {  },
  computed: {
    strDashboardsList: function () { return t('Lista Bacheche') },
    strLoadMore: function () { return t('Load More') },
    strEnter: function () { return t('Entra') },
    strRegister: function () { return t('Iscriviti') },
    strRegisterRequest: function () { return t('Richiedi Iscrizione') },
    dashboards: function(){ return this.$store.state.dashboards.list }
  },
  methods: {
    t,
    loadMore(){
      this.$store.dispatch("dashboards/lastDashboardsLoadMore")
    },
    getSubscription(dashId){
      return this.$store.state.dashboards.subscriptionsByDashboardId[dashId]
    }
  },
  data() {
    return {
      // show: this.setShow||'Register'
    }
  }
}

</script>

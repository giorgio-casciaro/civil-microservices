<template>
<div class="DashboardsList">
  <h3>{{strDashboardsList}}</h3>
  <div v-for="(dashboard, index) in dashboards">
    <h4>{{dashboard.name}}</h4>
    <div class="tags">{{dashboard.tags.join(",")}}</div>
    <p>{{dashboard.description}}</p>
    <div v-if="dashboard.pics&&dashboard.pics[0]" class="image"><img :src="`${$store.state.apiServer}/dashboards/getPic/id/${dashboard.pics[0]}`" /></div>
    <a v-if="getSubscription(dashboard.id)" class="button" :href="'/#/dashboard/'+dashboard.id">{{strEnter}}</a>
    <a v-if="!getSubscription(dashboard.id)&&parseInt(dashboard.public)===1" @click="subscribe(dashboard.id)" class="button" >{{strRegister}}</a>
    <a v-if="!getSubscription(dashboard.id)&&parseInt(dashboard.public)===0" @click="subscriptionRequest(dashboard.id)" class="button" >{{strRegisterRequest}}</a>
  </div>
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
    },
    subscribe(dashId){
      this.$store.dispatch("dashboards/subscribe",{dashId})
    }
  },
  data() {
    return {
      // show: this.setShow||'Register'
    }
  }
}

</script>

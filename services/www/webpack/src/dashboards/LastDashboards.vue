<template>
<div class="LastDashboards">
  <h3>{{strLastDashboards}}</h3>
  <div v-for="(dashboard, index) in dashboards">
    <!-- {{dashboard}} -->
    <h4>{{dashboard.name}}</h4>
    <div class="tags">{{dashboard.tags.join(",")}}</div>
    <p>{{dashboard.description}}</p>
    <div v-if="dashboard.pics&&dashboard.pics[0]" class="image"><img :src="`${$store.state.apiServer}/dashboards/getPic/id/${dashboard.pics[0]}`" /></div>
    <!-- <a v-if="getSubscription(dashboard.id)" class="button" :href="'/#/dashboard/'+dashboard.id">{{strEnter}}</a> -->
    <!-- <a v-if="getSubscription(dashboard.id)||dashboard.options.guestRead==='allow'"  :href="'/#/dashboard/'+dashboard.id" class="button" >Leggi</a>
    <a v-if="!getSubscription(dashboard.id)&&dashboard.options.guestSubscribe==='allow'" @click="subscribe(dashboard.id)" class="button" >Iscriviti</a>
    <a v-if="!getSubscription(dashboard.id)&&dashboard.options.guestSubscribe==='confirm'" @click="subscribe(dashboard.id)" class="button" >Richiedi Iscrizione</a>
    <a v-if="!getSubscription(dashboard.id)&&(dashboard.options.guestWrite==='allow'||dashboard.options.guestWrite==='confirm')" @click="subscribe(dashboard.id)" class="button" >Invia Messaggio</a> -->

    <a v-if="can(dashboard.id,'postsReads')||dashboard.options.guestRead==='allow'" :href="'/#/dashboard/'+dashboard.id" class="button" >Leggi</a>
    <a v-if="can(dashboard.id,'subscribe')||dashboard.options.guestSubscribe==='allow'"  @click="subscribe(dashboard.id)" class="button" >Iscriviti</a>
    <a v-if="can(dashboard.id,'confirmSubscribe')||dashboard.options.guestSubscribe==='confirm'"  @click="subscribe(dashboard.id)" class="button" >Richiedi Iscrizione</a>


    <!-- <a :href="'/#/dashboard/'+dashboard.id" class="button" >Leggi</a>
    <a @click="subscribe(dashboard.id)" class="button" >Iscriviti</a> -->
    <!-- <a @click="subscribe(dashboard.id)" class="button" >Richiedi Iscrizione</a>
    <a @click="subscribe(dashboard.id)" class="button" >Invia Messaggio</a> -->
    <!-- <a v-if="!getSubscription(dashboard.id)&&(dashboard.public)===1" @click="subscribe(dashboard.id)" class="button" >{{strRegister}}</a>
    <a v-if="!getSubscription(dashboard.id)&&(dashboard.public)===0" @click="subscriptionRequest(dashboard.id)" class="button" >{{strRegisterRequest}}</a> -->
  </div>
  <div><a class="button" @click="loadMore">{{strLoadMore}}</a></div>
</div>
</template>
<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
export default {
  name: 'LastDashboards',
  props:{
    // setShow: { type: String },
  },
  created(){
    this.$store.dispatch("dashboards/lastDashboards")
    // call('dashboards', 'queryLastDashboards', {from: 0, to: pageLength}, (payload) => store.commit('DASHBOARDS_LIST', payload))
  },
  components: {  },
  computed: {
    strLastDashboards: function () { return t('Ultime Bacheche') },
    strLoadMore: function () { return t('Load More') },
    strEnter: function () { return t('Entra') },
    strRegister: function () { return t('Iscriviti') },
    strRegisterRequest: function () { return t('Richiedi Iscrizione') },
    dashboards: function(){ return this.$store.state.dashboards.lastDashboards }
  },
  methods: {
    t(string) {
      return this.$store.getters['dashboards/t'](string)
    },
    can(dashId,permission) {
      return this.$store.getters['dashboards/can'](dashId, permission)
    },
    toDate(timestamp, format) {
      return this.$store.getters['toDate'](timestamp, format)
    },
    loadMore(){
      this.$store.dispatch("dashboards/lastDashboardsLoadMore")
    },
    // getSubscription(dashId){
    //   return this.$store.state.dashboards.subscriptionsById.find(subscription=>subscription.dashId===dashId)
    // },
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

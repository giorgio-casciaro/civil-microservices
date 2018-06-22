<template>
<div class="SinglePost">
  <!-- {{post}} -->
<div v-if="post.user" class="user" >{{strCreatedBy}} <a class="username">{{post.user.publicName}}</a> <span class="role" :title="role.description">{{role.name}}</span></div>
 <div class="created">{{strCreatedDate}} {{toDate(post.created)}}</div>
<div class="updated" v-if="post.updated!==post.created">{{strUpdatedDate}} {{toDate(post.updated)}}</div>
<div class="tags">
  <span v-for="(item, index) in post.tags"> #{{ item }} </span>
</div>
<div v-if="can('writePosts')"><a @click="edit_mode=!edit_mode">Edit</a></div>
<div v-if="can('postsConfirms')&&!post._confirmed"><a @click="confirm()">Confirm</a></div>
<h4>{{post.name}}</h4>
<div class="body">{{post.body}}</div>

<div v-if="edit_mode">
  <SinglePostEdit :post="post" :dashId="post.dashId"></SinglePostEdit>
</div>
<!-- <pre>{{post}}</pre> -->
<!--<pre>{{role}}</pre>
<pre>{{subscription}}</pre>
<pre>{{user}}</pre> -->
</div>
</template>
<script>
import SinglePostEdit from '@/dashboards/SinglePostEdit'
const mapboxgl = require('mapbox-gl')

export default {
  name: 'SinglePost',
  props: {'postId': String, 'show': String},
  components: { SinglePostEdit },
  computed: {
    // subscription: function () { return this.$store.state.dashboards.extendedSubscriptionsById[this.post.subscriptionId]},
    role: function () {
      if (this.$store.state.dashboards.dashboardsById[this.post.dashId]) return this.$store.state.dashboards.dashboardsById[this.post.dashId].roles[this.post.subscription.roleId]
      else this.$store.dispatch('dashboards/loadDashboard', {dashId:this.post.dashId})
    },
    // user: function () { return this.$store.state.users.usersById[this.post.userId]},
    strCreatedBy: function () { return this.t('Creato da') },
    strCreatedDate: function () { return this.t('Creato') },
    strUpdatedDate: function () { return this.t('Aggiornato') },
    map: function () { return this.$store.state.dashboards.dashboardsMaps[this.post.dashId][0] },
    location: function () { return this.post.location },
    post: function () {
      this.$store.dispatch('dashboards/loadPost', {postId:this.postId})
      return this.$store.getters['dashboards/getPost'](this.postId)
    }
  },
  mounted () {
    if (this.post.location && this.post.location[0]) this.$store.dispatch('dashboards/addDashboardMapPoint', {id: this.post.id + '_0', dashId: this.post.dashId, lat: this.post.location[0].lat, lng: this.post.location[0].lng})
  },
  methods: {
    t(string) {
      return this.$store.getters['dashboards/t'](string)
    },
    can(permission) {
      return this.$store.getters['dashboards/can'](this.post.dashId, permission)
    },
    toDate(timestamp, format) {
      return this.$store.getters['toDate'](timestamp, format)
    },
    confirm(){return this.$store.dispatch('dashboards/postsConfirm',this.post.id)},

  },
  data () {
    return {
      edit_mode: false
    }
  }
}


</script>

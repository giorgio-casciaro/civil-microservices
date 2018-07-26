<template>
<div class="Notification">
  {{notification}}
<div v-if="notification.user" class="user" >{{strCreatedBy}} <a class="username">{{notification.user.publicName}}</a> <span class="role" :title="role.description">{{role.name}}</span></div>
<div class="tags">
  <span v-for="(item, index) in notification.tags"> #{{ item }} </span>
</div>
<h4>{{notification.name}}</h4>
<div class="body">{{notification.body}}</div>

</div>
</template>
<script>

export default {
  name: 'Notification',
  props: {'notificationId': String, 'show': String},
  computed: {
    notification: function () {
      this.$store.dispatch('users/notificationLoad', {notificationId:this.notificationId})
      return this.$store.getters['users/notificationGet'](this.notificationId)
    }
  },
  methods: {
    t(string) {
      return this.$store.getters['users/t'](string)
    },
    toDate(timestamp, format) {
      return this.$store.getters['toDate'](timestamp, format)
    },
    readed(){return this.$store.dispatch('users/notificationReaded',this.notification.id)},
  },
  data () {
    return {

    }
  }
}


</script>

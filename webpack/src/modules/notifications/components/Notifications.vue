<template>
<div class="NotificationsList">
  <h4>Ultime Notifiche</h4>
    <div v-if="notifications.status==='loading'">
      Caricamento Messaggi
    </div>
    <div v-if="notifications.items">
      <div v-for="(notificationId, index) in notifications.items">
        <Notification :notificationId="notificationId"></Notification>
      </div>
    </div>
    <div v-if="!notifications.items">
      Non ci sono notifiche
    </div>
    <div><a class="button" @click="reload">Aggiorna</a></div>
    <div><a class="button" @click="loadMore">Carica altre notifiche</a></div>
</div>
</template>
<script>
import Notification from '@/users/components/Notification'
import {
  translate
} from '@/translations'

export default {
  name: 'NotificationsList',
  mounted() {
    this.$store.dispatch("users/notificationsLoad")
  },
  computed: {
    notifications: function() {
      return this.$store.state.users.currentUser.notificationsList||[]
    }
  },
  components: {
    Notification
  },
  methods: {
    t(string) {
      console.log("translate string", string)
      return translate("notifications", string)
    },
    loadMore() {
      this.$store.dispatch("users/notificationsLoadMore")
    },
    reload() {
      this.$store.dispatch("users/notificationsLoad")
    }
  },
  data() {
    return {
      dataLoaded: false
    }
  }
}
</script>

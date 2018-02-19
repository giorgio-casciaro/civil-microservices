<template>
<div class="DashboardPostsList">
  <h4>Ultimi Messaggi</h4>
  {{posts.items}}
    <div v-if="posts.status==='loading'">
      Caricamento Messaggi
    </div>
    <div v-if="posts.items">
      <div v-for="(postId, index) in posts.items">
        <SinglePost :postId="postId"></SinglePost>
      </div>
    </div>
    <div v-if="!posts.items">
      Non ci sono messagi in questa bacheca
    </div>
    <div><a class="button" @click="reload">Aggiorna</a></div>
    <div><a class="button" @click="loadMore">Carica altri post</a></div>
</div>
</template>
<script>
import SinglePost from '@/dashboards/SinglePost'
import {
  translate
} from '@/i18n'

export default {
  name: 'DashboardPostsList',
  props: {
    "dashId": Number
  },
  mounted() {
    this.$store.dispatch("dashboards/lastDashboardPosts", {
      dashId: this.dashId
    })
  },
  components: {
    SinglePost
  },
  computed: {
    posts: function() {
      return this.$store.state.dashboards.dashboardsPostsList[this.dashId]||{}
    }
  },
  methods: {
    t(string) {
      console.log("translate string", string)
      return translate("dashboards", string)
    },
    loadMore() {
      this.$store.dispatch("dashboards/lastDashboardPostsLoadMore", {
        dashId: this.dashId
      })
    },
    reload() {
      this.$store.dispatch("dashboards/lastDashboardPosts", {
        dashId: this.dashId
      })
    }
  },
  data() {
    return {
      dataLoaded: false
    }
  }
}
</script>

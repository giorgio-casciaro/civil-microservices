<template>
<div class="DashboardPostsToConfirmList">
  <h4>Messaggi da confermare</h4>
  <!-- <pre>{{posts}}</pre> -->
    <div v-if="posts">
      <div v-for="(postId, index) in posts">
        <SinglePost :postId="postId"></SinglePost>
      </div>
    </div>
    <div v-if="!posts">
      Non ci sono messagi da confermare
    </div>
</div>
</template>
<script>
import SinglePost from '@/dashboards/SinglePost'
import {
  translate
} from '@/i18n'

export default {
  name: 'DashboardPostsToConfirmList',
  props: {
    "dashId": Number
  },
  // mounted() {
  //   this.$store.dispatch("dashboards/lastDashboardPosts", {
  //     dashId: this.dashId
  //   })
  // },
  components: {
    SinglePost
  },
  computed: {
    dashboard: function() {
      return this.$store.getters["dashboards/getDashboard"](this.dashId)
    },
    posts: function() {
      return this.dashboard.postsToConfirmMeta||[]
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

<template>
<div class="apiQuery">
  <!-- {{state.response.results}} -->
  <div v-if="!logged||$store.state.users.currentUser.logged">
    <div v-if="$store.state[service].queries[queryId]">
      <slot v-for="item in $store.state[service].queries[queryId].results":viewId="item"></slot>
    </div>
  </div>
  <div v-if="logged&&!$store.state.users.currentUser.logged" class="notLogged">{{t("Devi essere loggato per vedere questo form")}}</div>
</div>
</template>


<script>
export default {
  props: {
    'queryId': {
      type: String,
      required: true
    },
    'service': {
      type: String,
      required: true
    },
    'method': {
      type: String,
      required: true
    },
    'logged': Boolean,
    'data': Object
  },
  async created() {
    this.state.response = await this.$store.dispatch(this.service + "/apiQuery", {
      method: this.method,
      queryId: this.queryId,
      data: this.data
    })
    this.$emit('update:state', this)
    if (this.state.response.success) setTimeout(() => this.$emit("success", this.state.response), this.delay || 0)
    else if (this.state.response.error) setTimeout(() => this.$emit('error', this.state.response), this.delay || 0)

  },
  data() {
    return {
      state: {
        active: false,
        waiting: false,
        response: false
      }
    }
  },
  methods: {
    t(string) {
      return this.$store.getters[this.service + "/t"](string)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

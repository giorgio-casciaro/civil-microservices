<template>
<div class="apiView">
  <div v-if="!logged||$store.state.users.currentUser.logged">
    <div v-if="state.error">apiView ERROR:{{t(state.error)}}</div>
    <div v-if="state.view"><slot v-bind:view="state.view"></slot></div>
  </div>
  <div v-if="logged&&!$store.state.users.currentUser.logged" class="notLogged">{{t("Devi essere loggato per vedere questo form")}}</div>
</div>
</template>


<script>

export default {
  props: {
    'viewId':{
      required: true
    },
    'service':{
      type: String,
      required: true
    },
    'fields':{
      type: Array,
      required: false
    },
    'logged':Boolean
  },
  async created() {
    await this.load()
  },
  data() {
    return {
      state:{}
    }
  },
  methods: {
    async load(){
      if(!this.viewId)return false
      this.state = await this.$store.dispatch(this.service + "/apiView", {
        viewId: this.viewId,fields:this.fields
      })
      console.log("load",this.view)
    },
    t(string) {
      return this.$store.getters[this.service + "/t"](string)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

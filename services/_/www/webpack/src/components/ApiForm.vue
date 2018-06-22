<template>
<form @click="active=true" @submit.prevent="state.waiting=true; call()" @input="validate()" :class="{validForm:state.validation.valid,activeForm:state.active,waitingForm:state.waiting}">
  <slot v-bind:state="state"></slot>
  {{state.validation}}
  <div v-if="!logged||$store.state.users.currentUser.logged">
    <div v-if="state.response.success" class="success">{{t(state.response.success)}}</div>
    <div v-if="state.response.error" class="error">{{t(state.response.error)}}</div>
    <div v-if="state.validation.errors" class="validationErrors">validationErrors
      <div v-for="(fieldErrors,fieldName) in state.validation.errors" class="fieldErrors">
        <div v-for="error in fieldErrors" class="error"><strong>{{fieldName}}</strong> {{t(error)}}</div>
      </div>
    </div>
  </div>
  <div v-if="logged&&!$store.state.users.currentUser.logged" class="notLogged">{{t("Devi essere loggato per vedere questo form")}}</div>
</form>
</template>


<script>

export default {
  props: {
    'service':{
      type: String,
      required: true
    },
    'method':{
      type: String,
      required: true
    },
    'logged':Boolean,
    'success':Function,
    'error':Function,
    'extraValidation':Function,
    'delay':Function,
    'successString':String,
    'errorString':String,
    'v-model':Object
  },
  // props: ['v-model', 'service', 'method', 'success', 'error', 'successString', 'errorString', 'extraValidation','delay','logged'],
  data() {
    return {
      state: {
        active: false,
        waiting: false,
        response: false,
        validation: {
          errors: {}
        }
      }
    }
  },
  methods: {
    async validate() {
      //check se presenti service info in store e update serviceinfo

      // this.state.validation = await api.validate(this.service, this.method, this.vModel, this.extraValidation)
      this.state.validation= await this.$store.dispatch(this.service+"/apiValidate",{method:this.method, data:this.vModel, extraValidation:this.extraValidation})
      console.log("ApiForm validate", this.state.validation)
      this.$emit('update:state', this)
    },
    async call() {
      // this.state.response = await api.call(this.service, this.method, this.vModel)
      this.state.response= await this.$store.dispatch(this.service+"/apiCall",{method:this.method, data:this.vModel})
      this.$emit('update:state', this)
      if(this.state.response.success)setTimeout(()=>this.$emit("success", this.state.response),this.delay||0)
      else if(this.state.response.error)setTimeout(()=>this.$emit('error', this.state.response),this.delay||0)
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

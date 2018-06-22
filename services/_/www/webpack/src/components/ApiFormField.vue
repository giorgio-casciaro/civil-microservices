<template>
<div class="ApiFormField">
  <slot></slot>
  <div v-if="apiFormData.state&&apiFormData.state.validation.errors&&apiFormData.state.validation.errors[name]" class="validationErrors">validationErrors
      <div v-for="error in apiFormData.state.validation.errors[name]" class="error">{{t(error)}}</div>
  </div>
</div>
</template>


<script>
export default {
  props: ['apiFormData', 'name'],
  data() {
    return {}
  },
  methods: {
    t(string) {
      return this.apiFormData.t(string)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

<template>
  <div>
  <div v-if="success" class="success" v-html="success"></div>
  <div v-if="error" class="error" v-html="error"></div>
  <div v-if="errors" class="errors">
    <div v-for="(fieldErrors,fieldName) in errors" class="fieldErrors">
      <div v-for="error in fieldErrors" class="error"><strong>{{fieldName}}</strong> {{getter_t(error)}}</div>
    </div>
  </div>
</div>
</template>
<script>
import { mapMutations, mapGetters, mapActions } from 'vuex'
import storeModule from '../store'
const mapWithPrefix = (obj, prefix, moduleName = 'users') => Object.keys(obj).reduce((a, b) => Object.assign(a, {[prefix + '_' + b]: moduleName + '/' + b}), {})

export default {
  props:["success","error","errors"],
  computed: { ...mapGetters(mapWithPrefix(storeModule.getters, 'getter')) },
  data () { return { } }
}
</script>
<style scoped></style>

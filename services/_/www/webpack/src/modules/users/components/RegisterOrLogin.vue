<template>
<div class="RegisterOrLogin">
  <Login v-if="show==='Login'" @success="$emit('loginSuccess')"></Login>
  <Register v-if="show==='Register'"  ></Register>
  <div class="toLogin" v-if="show==='Register'">{{getter_t("hai già un account?")}}<a class="button" @click="show='Login'">{{getter_t("Accedi")}}</a></div>
  <div class="toRegister" v-if="show==='Login'">{{getter_t("non hai ancora un account?")}}<a class="button" @click="show='Register'">{{getter_t("Registrati")}}</a></div>
</div>
</template>
<script>
import moduleMixin from '../moduleMixin'
import Login from './Login'
import Register from './Register'
export default {
  mixins: [moduleMixin],
  props:{ setShow: { type: String, default:'Register' } },
  components: { Login, Register },
  data() { return {
    show: this.setShow
  }}
}
</script>

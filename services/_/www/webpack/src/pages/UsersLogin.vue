<template>
<section class="Login">
    <header>
      <h3 v-html="getter_t('Login')"></h3>
      <p v-html="getter_t('inserisci email e password per accedere all\'applicazione')"></p>
    </header>
    <Login  @success="succ"></Login>
</section>
</template>
<script>
import Login from '@/modules/users/components/Login'
import pageMixin from './pageMixin'

export default {
  mixins: [pageMixin],
  data() {
    return {
      email: this.$route.params.email
    }
  },
  components: {Login},
  methods: {
    succ(body){
      console.log("succ",body)
      // if(body&&body.email)this.email=body.email
      // this.$router.push(url+this.email)
      // this.step=step
    }
}
}

</script>

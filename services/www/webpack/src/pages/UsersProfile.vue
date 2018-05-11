<template>
<section class="Profile">
    <header>
      <h3 v-html="getter_t('Profilo')"></h3>
      <p v-html="getter_t('di seguito le tue informazioni')"></p>
    </header>
    <div ><strong v-html="getter_t('Public Name')"></strong> : <span>{{$store.state.users.currentUser.currentState.publicName}}</span></div>
    <div ><strong v-html="getter_t('email')"></strong> : <span>{{$store.state.users.currentUser.email}}</span></div>
    <div ><strong v-html="getter_t('id')"></strong> : <span>{{$store.state.users.currentUser.id}}</span></div>
    <div >{{$store.state.users.currentUser}}</div>
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

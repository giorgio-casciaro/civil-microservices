<template>
<div v-if="$store.state.users.logged">
  <h3 v-html="str.title"></h3>
  <p v-html="str.description"></p>
  <PublicName></PublicName>
  <PersonalInfo></PersonalInfo>
  <ChangePassword></ChangePassword>
  <Pic></Pic>
  <Unregister @success="$router.push('/')"></Unregister>
</div>
</template>

<script language="javascript">
import {translate} from '@/i18n'
import PersonalInfo from '@/users/PersonalInfo'
import PublicName from '@/users/PublicName'
import ChangePassword from '@/users/ChangePassword'
import Pic from '@/users/Pic'
import Unregister from '@/users/Unregister'
var t = function (string) { return translate('app', string) }

export default {
  name: 'Dashboards',
  components: {PersonalInfo,PublicName,ChangePassword,Pic,Unregister},
  created(){
    if(!this.$store.state.users.logged)this.$router.push('/')
  },
  data () {
    return {
      str:{
        title: t( 'Profile'),
        description: t( 'Gestisci le tue informazioni personali')
      }
    }
  },
  methods: {
    t (string) { return translate('app', string) }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

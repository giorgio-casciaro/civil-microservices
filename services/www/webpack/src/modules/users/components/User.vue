<template>
<div class="User" >
  <div class="pic"><img v-if="user.hasPic" :src="`${$store.state.apiServer}/users/getPic/id/${user.id}/${user.random}_profile.jpeg?id=${user.id}`" /><span v-else >icoUnknowUser</span></div>
  <h4 v-html="user.publicName"></h4>
  <p v-html="user.email"></p>
</div>
</template>

<script>
import Vue from 'vue'

import {translate} from '@/i18n'
var t= function(string) { return translate( 'users', string) }


export default {
  name: 'User',
  data () {
    return {
      user: this.$store.state.users.currentUser
    }
  },
  computed: {
  },
  methods: {
    t
  }
}

</script>

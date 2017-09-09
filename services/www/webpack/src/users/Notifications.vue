<template>
<div class="Notifications" >
  <h3 v-html="strTitle"></h3>
  <ul>
    <li v-for="notification in notifications">
      <h4><a v-html="notification.title" ></a></h4>
      <div v-html="notification.content" ></div>
    </li>
  </ul>
</div>
</template>

<script>
import Vue from 'vue'
import {translate} from '@/i18n'
var t= function(string) { return translate( 'users', string) }

export default {
  name: 'Notifications',
  data () {
    var notifications=[];
    for (var i = 1; i <= 3; i++) notifications.push({title:"notification title",content:"saoi opnpo ahjpiu hoig g ooihgioh"});
    return {
      notifications
    }
  },
  computed: {
    strTitle: function () { return t(  'Notifications') }
  },
  methods: {
    t,
  }
}

</script>

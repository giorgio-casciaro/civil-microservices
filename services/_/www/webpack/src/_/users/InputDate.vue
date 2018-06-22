<template>
  <span @input="update()">
    <input class="day" :disabled="disabled" :placeholder="str.d" type="number" min="1" max="31" v-model="d" />/
    <input class="month" :disabled="disabled" :placeholder="str.m" type="number" min="1" max="12" v-model="m" />/
    <input class="year" :disabled="disabled" :placeholder="str.y" type="number" min="1917" max="2017" v-model="y" />
  </span>
</template>

<script type="text/javascript">

import {translate} from '@/translations'
var t= function(string) { return translate( 'users', string) }

export default {
  name: 'InputDate',
  props:['timestamp','disabled'],
  data(){
    return{
      y:new Date(this.timestamp).getFullYear()||"",
      m: new Date(this.timestamp).getMonth()||"",
      d:new Date(this.timestamp).getDate()||"",
      str:{
        y:t('Anno'),
        m:t('Mese'),
        d:t('Giorno')
      }
    }
  },
  methods: {
    t,
    update(){
      if(!this.y||!this.m||!this.d) return false
      var date=new Date()
      date.setFullYear(this.y)
      date.setMonth(this.m)
      date.setDate(this.d)
      date.setHours(12)
      var timestamp=date.getTime()
      if(!timestamp)return false
      this.$emit('update:timestamp',timestamp)
    }
  }
}
</script>

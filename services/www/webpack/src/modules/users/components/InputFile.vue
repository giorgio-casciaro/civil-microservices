<template>
  <a class=" button" @change="update($event)">
    <img :src="rawData" style="max-height:100px" />
    <input  type="file" name="file" :disabled="disabled"></a>
</template>

<script type="text/javascript">

import {translate} from '@/i18n'
var t= function(string) { return translate( 'users', string) }

export default {
  name: 'InputFile',
  props:['file','disabled'],
  data(){
    return{
      rawData:false
    }
  },
  methods: {
    t,
    update($event){
      console.log("$event",$event.target.files)
      // var data = new FormData();
      // data.append("file", $event.target.files[0]);
      // console.log("$event FormData",data)
      var img = new Image();
      this.rawData = window.URL.createObjectURL($event.target.files[0]);
      this.file = $event.target.files[0];
      this.$emit('update:file',$event.target.files[0])
    }
  }
}
</script>

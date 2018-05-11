<template>
  <form class="Pic" @click="active=true" @submit.prevent="waiting=true;call('dashboards','updatePic',form,succ,err)" @input="validation=validate('dashboards','updatePic',form)" :class="{validForm:validation.valid,activeForm:active}">
    <div class="pic"><img v-if="dashboard.hasPic" :src="`${$store.state.apiServer}/dashboards/getPic/id/${dashboard.id}/${dashboard.random}_profile.jpeg`" /><span v-else v-html="icoUnknowUser" /></div>
    <InputFile :file.sync="form.pic" :disabled="waiting" />
    <input type="submit" class="save button" :disabled="waiting" :class="{error,success,waiting}" :value="str.save">
    <div v-if="success" class="success" v-html="success"></div>
    <div v-if="error" class="error" v-html="error"></div>
    <div v-if="errors" class="errors">
      <div v-for="(fieldErrors,fieldName) in errors" class="fieldErrors">
        <div v-for="error in fieldErrors" class="error"><strong>{{fieldName}}</strong> {{t(error)}}</div>
      </div>
    </div>
  </form>
</template>

<script>
import {translate} from '@/i18n'
var t= function(string) { return translate( 'dashboards', string) }
import {validate,call} from '@/api'
import InputFile from './InputFile'

export default {
  name: 'Pic',
  components:{InputFile},
  data () {
    return {
      dashboard:this.$store.state.dashboards,
      form:{
        id: this.$store.state.dashboards.id,
        pic: undefined
      },
      str:{
        pic: t( 'Immagine'),
        save:t( 'Salva')
      },
      strPh:{
        pic: t( '')
      },
      active: false,
      error: false,
      success: false,
      waiting: false,
      errors:false,
      validation: {
        errors: {}
      }
    }
  },
  methods: {
    validate,
    t,
    call,
    test(){
      return this.$store.state.dashboards.token.split('.')[0]
      return  parseJwt(this.$store.state.dashboards.token)
    },
    err (msg, extra = false) {
        this.error = this.errors= this.waiting=false
        setTimeout(()=>this.error = t( msg),1)
        setTimeout(()=>this.errors = extra.errors,1)
        this.$emit("error")
    },
    succ (body) {
      this.waiting=false
      this.$store.dispatch('dashboards/update', {mutation:'PIC_UPDATED',payload:this.form})
      this.$store.commit('dashboards/CHANGE_RANDOM',Math.random())
      this.success = t( 'Immagine Aggiornata')
      setTimeout(()=>this.$emit("success"),2000)
    }
  }
}
</script>

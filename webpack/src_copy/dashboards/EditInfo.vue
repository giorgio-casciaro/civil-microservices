<template>
<div class="DashboardEditForm">
  <DashboardMenu :dashboard="dashboard"></DashboardMenu>
  <h2>{{strPageTitle}}</h2>
  <p>{{strPageDescription}}</p>
  <div v-if="dashId" class="dashboardEditMenu"><a :href="'/#/dashboardEdit/'+dashId">Info</a> <a :href="'/#/dashboardEditMaps/'+dashId">Mappe</a> <a :href="'/#/dashboardEditImages/'+dashId" >Immagini</a></div>
  <form   class="Edit" @click="active=true" @submit.prevent="submit()" @input="validation=validate('dashboards','create',form)" :class="{validForm:validation.valid,activeForm:active}">
    <div><h4>Nome</h4><input class="name" :placeholder="strName" :disabled="waiting" type="text" v-model="form.name" :class="{notValid:validation.errors.name}" /></div>
    <div><h4>Descrizione</h4><textarea class="description" :placeholder="strDescription" :disabled="waiting" type="text" v-model="form.description" :class="{notValid:validation.errors.description}" /></div>
    <div class="optionsGuestRead">
      <h4>Ospiti - Lettura</h4>
      <label>
        <input  :disabled="waiting" type="radio" value="allow" v-model="form.options.guestRead"  />
        <strong>Pubblica</strong><i> tutti possono leggere i messaggi</i>
      </label>
      <label>
        <input  :disabled="waiting" type="radio" value="deny" v-model="form.options.guestRead"  />
        <strong>Privata</strong><i> solo gli iscritti possono leggere i messaggi</i>
      </label>
    </div>
    <div class="optionsGuestSubscribe" >
      <h4>Ospiti - Iscrizione</h4>
      <label>
        <input  :disabled="waiting" type="radio" value="allow" v-model="form.options.guestSubscribe"  />
        <strong>Aperta</strong><i> tutti possono iscriversi alla bacheca</i>
      </label>
      <label>
        <input :disabled="waiting" type="radio" value="deny" v-model="form.options.guestSubscribe"  />
        <strong>Chiusa</strong><i> solo gli utenti invitati possono iscriversi</i>
      </label>
      <label >
        <input   :disabled="waiting" type="radio" value="confirm" v-model="form.options.guestSubscribe"  />
        <strong>Dopo conferma</strong><i> le iscrizioni rimangono in attesa fino alla conferma dell'amministratore</i>
      </label>
    </div>
    <div class="optionsGuestWrite">
      <h4>Ospiti - Lettura</h4>
      <label>
        <input  :disabled="waiting" type="radio" value="allow" v-model="form.options.guestWrite"  />
        Possono pubblicare messaggi
      </label>
      <label>
        <input :disabled="waiting" type="radio" value="deny" v-model="form.options.guestWrite"  />
        Non possono pubblicare messaggi
      </label>
      <label >
        <input   :disabled="waiting" type="radio" value="confirm" v-model="form.options.guestWrite"  />
        I messaggi necessitano di conferma da parte dell'amministratore
      </label>
    </div>
    <div class="optionsSubscriberWrite">
      <h4>Sottoscrittori - Utenti iscritti alla bacheca</h4>
      <label>
        <input  :disabled="waiting" type="radio" value="allow" v-model="form.options.subscriberWrite"  />
        Possono pubblicare messaggi
      </label>
      <label>
        <input :disabled="waiting" type="radio" value="deny" v-model="form.options.subscriberWrite"  />
        Non possono pubblicare messaggi
      </label>
      <label >
        <input   :disabled="waiting" type="radio" value="confirm" v-model="form.options.subscriberWrite"  />
        I messaggi necessitano di conferma da parte dell'amministratore
      </label>
    </div>
    #<input :placeholder="strTag" :disabled="waiting" type="text" v-model="newtag" :class="{notValid:!newtag||tagValidation.errors['']}" @input="tagValidation=validateRaw({'type':'string','minLength': 3},newtag)" />
    <input type="button" class="button" @click="addTag(newtag)" :disabled="!newtag||tagValidation.errors['']" :value="strAddTag"></input>
    <a v-for="(item, index) in dashboardsMeta.tags" v-if="form.tags.indexOf(clearTag(item[0]))===-1" class="button" @click="addTag(item[0])">{{item[0]}}</a>
    <ul class="tags">
      <li v-for="(item, index) in form.tags">
        #{{ item }} <a class="button" @click="removeTag(item)">X</a>
      </li>
    </ul>
    <input type="reset" class="annulla button" :disabled="waiting" :class="{error,success,waiting}" :value="strReset">
    <input v-if="dashId" type="submit" class="edit button" :disabled="waiting" :class="{error,success,waiting}" :value="strEdit">
    <input v-if="!dashId" type="submit" class="create button" :disabled="waiting" :class="{error,success,waiting}" :value="strCreate">
    <div v-if="success" class="success" v-html="success"></div>
    <div v-if="error" class="error" v-html="error"></div>
    <div v-if="errors" class="errors">
      <div v-for="(fieldErrors,fieldName) in errors" class="fieldErrors">
        <div v-for="error in fieldErrors" class="error"><strong>{{fieldName}}</strong> {{t(error)}}</div>
      </div>
    </div>
  </form>
  <!-- </div> -->
  {{form}}
</div>
<!-- <Login v-if="show==='Login'" @success="$emit('loginSuccess')"></Login>
  <Register v-if="show==='Register'"  @success="$emit('registerSuccess')"></Register>
  <div class="toLogin" v-if="show==='Register'">{{strHaveAccount}}<a class="button" @click="show='Login'">{{strLogin}}</a></div>
  <div class="toRegister" v-if="show==='Login'">{{strNotHaveAccount}}<a class="button" @click="show='Register'">{{strRegister}}</a></div>
</div>-->
</template>
<script>
const mapboxgl = require("mapbox-gl")
const style = require("../assets/mapstyle")
import DashboardMenu from '@/dashboards/Menu'

import {
  translate
} from '@/i18n'
var t = function(string) {
  return translate('dashboards', string)
}
import {
  validate,
  validateRaw,
  call
} from '@/api'
var map

// var updateMapForm=function(msg, extra = false) {
//   var bounds=map.getBounds()
//   bounds._ne.lat,bounds._ne.lng,bounds._sw.lat,bounds._sw.lng
// }
var defaultForm={
  options:{
    guestRead:"allow",
    guestSubscribe:"confirm",
    guestWrite:"confirm",
    subscriberWrite:"allow"
  },
  tags: [],
  maps: [
    {
      centerLng: 12.73931877340101,
      centerLat: 42.42996538898933,
      zoom: 4
    }
  ]
}
export default {
  name: 'DashboardsEdit',
  created() {
    // this.$store.dispatch("dashboards/lastDashboardPosts",{ dashId:this.dashId })
  },
  mounted() {
    if (this.dashboard) {
      this.form = this.dashboard
    }
    if(!this.form.options){
      this.form.options=defaultForm.options
    }
  },
  watch: {
    dashboard: function (val) {
      if(!this.formSetted){
        this.form = this.dashboard
        if(!this.form.options){
          this.form.options=defaultForm.options
        }
        this.formSetted=true
      }
    }
  },
  components: { DashboardMenu },
  computed: {
    strPageTitle: function() {
      return translate('app', 'Bacheca')
    },
    strPageDescription: function() {
      return translate('app', 'Compila il form per modificare la tua bacheca')
    },
    dashId: function() {
      return parseInt(this.$route.params.dashId)
    },
    dashboard: function() {
      return this.$store.state.dashboards.dashboardsById[this.dashId]
    },
    strEdit: function() {
      return t('Salva')
    },
    strCreate: function() {
      return t('Crea')
    },
    strReset: function() {
      return t('Annulla')
    },
    strName: function() {
      return t('Nome Bacheca')
    },
    strTag: function() {
      return t('Nuovo tag')
    },
    strDescription: function() {
      return t('Descrizione Bacheca')
    },
    strPublic: function() {
      return t('Pubblica')
    },
    strPublicWithApprovation: function() {
      return t('Pubblica con approvazione dei messaggi')
    },
    strPrivate: function() {
      return t('Privata')
    },
    strAddTag: function() {
      return t('+')
    },
    strPublicDescription: function() {
      return t('Una bacheca privata necessita dell\'approvazione dell\'amministratore per iscriversi')
    },
    dashboardsMeta: function() {
      return this.$store.state.dashboards.dashboardsMeta
    }
  },
  methods: {
    t,
    validate,
    call,
    validateRaw,
    submit() {
      this.waiting = true;
      if (this.dashId) {
        call('dashboards', 'update', this.form, this.succ, this.err)
      } else {
        call('dashboards', 'create', this.form, this.succ, this.err)
      }
    },
    updateMapForm() {
      var center = map.getCenter()
      var zoom = map.getZoom()
      this.form.maps = [{
        centerLat: center.lat,
        centerLng: center.lng,
        zoom
      }]
      console.log("updateMapForm", center, zoom)
    },
    err(msg, extra = false) {
      this.error = this.errors = this.waiting = false
      setTimeout(() => this.error = t(msg), 1)
      setTimeout(() => this.errors = extra.errors, 1)
      this.$emit("error")
    },
    succ(body) {
      this.waiting = false
      // this.$store.commit('users/REGISTERED', body)
      this.success = t('Bacheca salvata con successo')
      setTimeout(() => this.$emit("success"), 2000)
    },
    validateTag() {
      this.waiting = true;
      if (this.dashId) {
        call('dashboards', 'update', this.form, this.succ, this.err)
      } else {
        call('dashboards', 'create', this.form, this.succ, this.err)
      }
    },
    addTag(tag) {
      tag=tag.replace("#","")
      if(this.form.tags.indexOf(tag)<0)this.form.tags.push(tag|| "")
    },
    clearTag(tag) {
      return tag.replace("#","")
    },
    removeTag(tag) {
      var index = this.form.tags.indexOf(tag);
      if (index > -1) this.form.tags.splice(index, 1);
    },
  },
  data() {
    return {
      form: defaultForm,
      tagValidation:false,
      newtag: "",
      active: false,
      error: false,
      success: false,
      waiting: false,
      errors: false,
      validation: {
        errors: {}
      }
    }
  }
}
</script>

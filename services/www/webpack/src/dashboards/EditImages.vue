<template>
<div class="DashboardEditForm">
  <!-- <div class="createIntro" v-if="show==='createIntro'"><a class="button" @click="show='createForm'">{{strDashboardsEdit}}</a></div>
  <div class="createForm" v-if="show==='createForm'"> -->
  <form class="Edit" @click="active=true" @submit.prevent="submit()" @input="validation=validate('dashboards','create',form)" :class="{validForm:validation.valid,activeForm:active}">
    <div><input class="name" :placeholder="strName" :disabled="waiting" type="text" v-model="form.name" :class="{notValid:validation.errors.name}" /></div>
    <div><textarea class="description" :placeholder="strDescription" :disabled="waiting" type="text" v-model="form.description" :class="{notValid:validation.errors.description}" /></div>
    <div>
      <input id="dashboardsRadioInputPublic" class="public" :disabled="waiting" type="radio" value="1" v-model="form.public" :class="{notValid:validation.errors.public}" />
      <label for="dashboardsRadioInputPublic">{{strPublic}}</label>
      <input id="dashboardsRadioInputPrivate" class="public" :disabled="waiting" type="radio" value="0" v-model="form.public" :class="{notValid:validation.errors.public}" />
      <label for="dashboardsRadioInputPrivate">{{strPrivate}}</label>
      <input id="dashboardsRadioInputPublicWithApprovation" class="publicWithApprovation" :disabled="waiting" type="radio" value="2" v-model="form.public" :class="{notValid:validation.errors.public}" />
      <label for="dashboardsRadioInputPublicWithApprovation">{{strPublicWithApprovation}}</label>
    </div>
    #<input class="tag" :placeholder="strTag" :disabled="waiting" type="text" v-model="newtag" />
    <a class="button" @click="addTag(newtag)">add tag</a>
    <a v-for="(item, index) in dashboardsMeta.tags" v-if="form.tags.indexOf(item[0])===-1" class="button" @click="addTag(item[0])">{{item[0]}}</a>
    <ul class="tags">
      <li v-for="(item, index) in form.tags">
        {{ item }} <a class="button" @click="removeTag(item)">X</a>
      </li>
    </ul>
    <!-- <a class="button" @click="addTag()">add tag</a>
      <ul class="tags">
        <li v-for="(item, index) in form.tags">
          <input class="tag" :placeholder="strTag" :disabled="waiting" type="text" v-model="form.tags[index]" :class="{notValid:validation.errors.tags}" />
        </li>
      </ul> -->
    <div>
      centerLat <input v-model="form.maps[0].centerLat" /><br> centerLng <input v-model="form.maps[0].centerLng" /><br> zoom <input v-model="form.maps[0].zoom" />
    </div>
    <div id='dashboardEditMap' style='width: 400px; height: 300px;'></div>
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


import {
  translate
} from '@/i18n'
var t = function(string) {
  return translate('dashboards', string)
}
import {
  validate,
  call
} from '@/api'
var map

// var updateMapForm=function(msg, extra = false) {
//   var bounds=map.getBounds()
//   bounds._ne.lat,bounds._ne.lng,bounds._sw.lat,bounds._sw.lng
// }

export default {
  name: 'DashboardsEdit',
  created() {
    // this.$store.dispatch("dashboards/lastDashboardPosts",{ dashId:this.dashId })
  },
  mounted() {
    // mapboxgl.accessToken = 'pk.eyJ1Ijoic2ludGJpdCIsImEiOiJjajIzMnk3NDUwMDExMnlvNzc2MXk2dXNuIn0.fmB5CPQudFNP9CqssSHG9g';
    var mapInfo = {
      centerLng:12.73931877340101,
      centerLat:42.42996538898933,
      zoom:4
    }
    if (this.dashId) {
      this.form = this.$store.state.dashboards.dashboardsById[this.dashId]
      mapInfo = this.form.maps[0]
    }
    var url = "/styles/osm-bright/style.json"
    console.log("mapstyle new", style)
    map = new mapboxgl.Map({
      container: 'dashboardEditMap',
      center: [mapInfo.centerLng, mapInfo.centerLat],
      style: style,
      zoom: mapInfo.zoom,
      interactive: true
    });
    map.addControl(new mapboxgl.NavigationControl())
    var $vueComponent = this
    map.on('load', function() {
      $vueComponent.updateMapForm()
    });
    map.on('move', function() {
      $vueComponent.updateMapForm()
    });
    map.on('zoomstart', function() {
      $vueComponent.updateMapForm()
    });
  },
  props: {
    "dashId": Number
  },
  components: {},
  computed: {
    strDashboardsEdit: function() {
      return t('Crea una Bacheca')
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
    submit() {
      this.waiting = true;
      if (this.dashId){ call('dashboards', 'update', this.form, this.succ, this.err)}
      else{ call('dashboards', 'create', this.form, this.succ, this.err) }
    },
    addTag() {
      this.form.tags.push("")
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
    addTag(tag) {
      this.form.tags.push(tag || "")
    },
    removeTag(tag) {
      var index = this.form.tags.indexOf(tag);
      if (index > -1) this.form.tags.splice(index, 1);
    },
  },
  data() {
    return {
      form: {
        public: 1,
        tags: [],
        maps: [{
          centerLat: 0,
          centerLng: 0,
          zoom: 5
        }]
      },
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

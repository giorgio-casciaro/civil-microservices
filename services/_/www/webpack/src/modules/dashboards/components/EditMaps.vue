<template>
<div class="DashboardEditForm">
  <DashboardMenu :dashboard="dashboard"></DashboardMenu>
  <h2>{{strPageTitle}}</h2>
  <p>{{strPageDescription}}</p>
  <div v-if="dashId" class="dashboardEditMenu"><a :href="'/#/dashboardEdit/'+dashId">Info</a> <a :href="'/#/dashboardEditMaps/'+dashId">Mappe</a> <a :href="'/#/dashboardEditImages/'+dashId" >Immagini</a></div>
  <form class="Edit" @click="active=true" @submit.prevent="submit()" @input="validation=validate('dashboards','create',form)" :class="{validForm:validation.valid,activeForm:active}">
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
</div>
</template>
<script>
const mapboxgl = require("mapbox-gl")
const style = require("../assets/mapstyle")
import DashboardMenu from '@/dashboards/Menu'

import {
  translate
} from '@/translations'
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
  },
  mounted() {
    if (this.dashboard) {
      this.form = this.dashboard
      this.mapMount()
    }
  },
  watch: {
    dashboard: function (val) {
      if(!this.mapMounted){
        this.form = this.dashboard
        this.mapMount()
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
    mapMount() {
      // mapboxgl.accessToken = 'pk.eyJ1Ijoic2ludGJpdCIsImEiOiJjajIzMnk3NDUwMDExMnlvNzc2MXk2dXNuIn0.fmB5CPQudFNP9CqssSHG9g';
      var mapInfo = {
        centerLng: 12.73931877340101,
        centerLat: 42.42996538898933,
        zoom: 4
      }
      // if(this.$route.params.dashId&&!this.dashId)this.dashId=this.$route.params.dashId
      if (this.form.maps) {
        // this.form = this.$store.state.dashboards.dashboard
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
      this.mapMounted=true
    }
  },
  data() {
    return {
      form: {
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

<template>
<div class="DashboardPostCreateForm">
  {{dashboard}}
  <!-- <div class="createIntro" v-if="show==='createIntro'"><a class="button" @click="show='createForm'">{{strDashboardsCreate}}</a></div>
  <div class="createForm" v-if="show==='createForm'"> -->
  <form class="Create" @click="active=true" @submit.prevent="waiting=true;call('dashboards','createPost',form,succ,err)" @input="validation=validate('dashboards','createPost',form)" :class="{validForm:validation.valid,activeForm:active}">
    <div><textarea class="body" :placeholder="strBody" :disabled="waiting" type="text" v-model="form.body" :class="{notValid:validation.errors.body}" /></div>
    <div>
      <input id="dashboardsRadioInputPublic" class="public" :disabled="waiting" type="radio" value="1" v-model="form.public" :class="{notValid:validation.errors.public}" />
      <label for="dashboardsRadioInputPublic">{{strPublic}}</label>
      <input id="dashboardsRadioInputPrivate" class="public" :disabled="waiting" type="radio" value="0" v-model="form.public" :class="{notValid:validation.errors.public}" />
      <label for="dashboardsRadioInputPrivate">{{strPrivate}}</label>
      <div>{{strPublicDescription}}</div>
    </div>
    <div v-if="form.public==='0'||form.public===0">
      <label class="to" v-for="(item, index) in dashboard.subscriptionsMeta.tags" :class="{notValid:validation.errors.to}">
      <input  :disabled="waiting"  :value="item[0]"  type="checkbox" v-model="form.to" />{{item[0]}}
      </label>
    </div>
    #<input class="tag" :placeholder="strTag" :disabled="waiting" type="text" v-model="newtag" />
    <a class="button" @click="addTag(newtag)">add tag</a>
      <a v-for="(item, index) in dashboard.postsMeta.tags"  v-if="form.tags.indexOf(item[0])===-1" class="button" @click="addTag(item[0])">{{item[0]}}</a>
    <ul class="tags">
      <li v-for="(item, index) in form.tags">
        {{ item }} <a class="button" @click="removeTag(item)">X</a>
      </li>
    </ul>
    <!-- <input class="tags" :placeholder="strTags" :disabled="waiting" type="text" v-model="form.to" :class="{notValid:validation.errors.tags}" /> -->

    <a class="button" @click="addLocation()">add location</a>
    <div id='postCreateMap' style='width: 400px; height: 300px;'></div>
    {{form.location}}
    <input type="reset" class="annulla button" :disabled="waiting" :class="{error,success,waiting}" :value="strReset" @click="show='createIntro'">
    <input type="submit" class="create button" :disabled="waiting" :class="{error,success,waiting}" :value="strCreate">
    <div v-if="success" class="success" v-html="success"></div>
    <div v-if="error" class="error" v-html="error"></div>
    <div v-if="errors" class="errors">
      <div v-for="(fieldErrors,fieldName) in errors" class="fieldErrors">
        <div v-for="error in fieldErrors" class="error"><strong>{{fieldName}}</strong> {{t(error)}}</div>
      </div>
    </div>
    <pre>{{form}}</pre>
  </form>
  <!-- </div> -->
</div>
<!-- <Login v-if="show==='Login'" @success="$emit('loginSuccess')"></Login>
  <Register v-if="show==='Register'"  @success="$emit('registerSuccess')"></Register>
  <div class="toLogin" v-if="show==='Register'">{{strHaveAccount}}<a class="button" @click="show='Login'">{{strLogin}}</a></div>
  <div class="toRegister" v-if="show==='Login'">{{strNotHaveAccount}}<a class="button" @click="show='Register'">{{strRegister}}</a></div>-->
</div>
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
var mapMouseLngLat
var mapMousePosition
var activeMarker = false

// var updateMapForm=function(msg, extra = false) {
//   var bounds=map.getBounds()
//   bounds._ne.lat,bounds._ne.lng,bounds._sw.lat,bounds._sw.lng
// }

export default {
  name: 'DashboardPostCreate',
  mounted() {
    // mapboxgl.accessToken = 'pk.eyJ1Ijoic2ludGJpdCIsImEiOiJjajIzMnk3NDUwMDExMnlvNzc2MXk2dXNuIn0.fmB5CPQudFNP9CqssSHG9g';
    // if(!dashId||!dashboard){
    //
    // }
    var url = "/styles/osm-bright/style.json"
    // var url="/styles/klokantech-basic/style.json"
    // if(window.location.port==8080)url="https://localhost"+url
    // var dashboard = this.$store.state.dashboards.dashboardsById[this.dashId]
    var mapInfo = this.dashboard.maps[0]
    console.log("mapstyle new", style)

    map = new mapboxgl.Map({
      container: 'postCreateMap',
      center: [mapInfo.centerLng, mapInfo.centerLat],
      style: style,
      zoom: mapInfo.zoom,
      interactive: true
    });
    // map.addControl(new mapboxgl.Navigation({position: 'top-left'}));
    map.addControl(new mapboxgl.NavigationControl())
    map.on('mousedown', function(e) {
      mapMousePosition = e.lngLat
    });
    map.on('mousemove', function(e) {
      mapMouseLngLat = e.lngLat
      if (activeMarker) {
        activeMarker.setLngLat(mapMouseLngLat)
        activeMarker.input.lat = e.lngLat.lat
        activeMarker.input.lng = e.lngLat.lng
      }
      console.log("mousemove", mapMouseLngLat, mapMousePosition)
    });

  },
  props: {
    "dashId": Number
  },
  components: {},
  computed: {
    strPostCreate: function() {
      return t('Crea un Post')
    },
    strCreate: function() {
      return t('Crea')
    },
    strReset: function() {
      return t('Annulla')
    },
    strTo: function() {
      return t('Destinatari')
    },
    strTag: function() {
      return t('Nuovo tag')
    },
    strBody: function() {
      return t('Descrizione Body')
    },
    strPublic: function() {
      return t('Pubblico')
    },
    strPrivate: function() {
      return t('Privato')
    },
    strPublicDescription: function() {
      return t('Una messaggio privato è visibile solo ai gruppi di utenti selezionati')
    },
    dashboard: function() {
      return this.$store.state.dashboards.dashboardsById[this.dashId]
    }
  },
  methods: {
    t,
    validate,
    call,
    addLocation() {
      var el = document.createElement('div');
      el.className = 'marker';
      var center = map.getCenter()
      this.form.location.push({
        lat: center.lat,
        lng: center.lng
      })
      var marker = new mapboxgl.Marker(el, {
          //  offset: [-50 / 2, -50 / 2]
        })
        .setLngLat(center)
        .addTo(map);
      marker.input = this.form.location[this.form.location.length - 1]
      el.onmousedown = function() {
        activeMarker = marker
        map.dragPan.disable();
      };
      el.onmouseup = function() {
        activeMarker = false
        map.dragPan.enable();
      };
    },
    addTag(tag) {
      this.form.tags.push(tag || "")
    },
    removeTag(tag) {
      var index = this.form.tags.indexOf(tag);
      if (index > -1) this.form.tags.splice(index, 1);
    },
    // updateMapForm() {
    //   var center=map.getCenter()
    //   var zoom=map.getZoom()
    //   this.form.maps=[{
    //     centerLat:center.lat,
    //     centerLng:center.lng,
    //     zoom
    //   }]
    //   console.log("updateMapForm",center,zoom)
    // },
    err(msg, extra = false) {
      this.error = this.errors = this.waiting = false
      setTimeout(() => this.error = t(msg), 1)
      setTimeout(() => this.errors = extra.errors, 1)
      this.$emit("error")
    },
    succ(body) {
      this.waiting = false
      // this.$store.commit('users/REGISTERED', body)
      this.success = t('Post creato con successo')
      setTimeout(() => this.$emit("success"), 2000)
    }
  },
  data() {
    return {
      form: {
        public: 1,
        dashId: this.dashId,
        location: [],
        userId: this.$store.state.users.id,
        to: [],
        tags: []
      },
      newtag:"",
      // dashboard: this.$store.state.dashboards.dashboardsById[this.dashId],
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

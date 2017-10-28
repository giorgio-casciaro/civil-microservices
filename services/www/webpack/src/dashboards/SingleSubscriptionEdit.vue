<template>
<div class="DashboardSubscriptionCreateForm">
  <!-- <div class="createIntro" v-if="show==='createIntro'"><a class="button" @click="show='createForm'">{{strDashboardsCreate}}</a></div>
  <div class="createForm" v-if="show==='createForm'"> -->
  <form class="Create" @click="active=true" @submit.prevent="submitForm()" @input="validateForm()" :class="{validForm:validation.valid,activeForm:active}">
    <div><input class="name" :placeholder="strName" :disabled="waiting" type="text" v-model="form.name" :class="{notValid:validation.errors.name}" /></div>
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
    #<input :placeholder="strTag" :disabled="waiting" type="text" v-model="newtag" :class="{notValid:!newtag||tagValidation.errors['']}" @input="tagValidation=validateRaw({'type':'string','minLength': 3},newtag)" />
    <input type="button" class="button" @click="addTag(newtag)" :disabled="!newtag||tagValidation.errors['']" :value="strAddTag"></input>
    <a v-for="(item, index) in dashboard.subscriptionsMeta.tags" v-if="form.tags.indexOf(clearTag(item[0]))===-1" class="button" @click="addTag(item[0])">{{item[0]}}</a>
    <ul class="tags">
      <li v-for="(item, index) in form.tags">
        #{{ item }} <a class="button" @click="removeTag(item)">X</a>
      </li>
    </ul>
    <a class="button" @click="addLocation()">add location</a>
    <div :id="'subscriptionEditMap_'+(form.id||'new')" style='width: 400px; height: 300px;'></div>
    {{form.location}}
    <input type="reset" class="annulla button" :disabled="waiting" :class="{error,success,waiting}" :value="strReset" @click="show='createIntro'">
    <input type="submit" class="create button" :disabled="waiting" :class="{error,success,waiting}" :value="strSubmit">
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
  validateRaw,
  call
} from '@/api'
var map
var mapMouseLngLat
var mapMousePosition
var activeMarker = false


export default {
  name: 'DashboardSubscriptionCreate',
  mounted() {
    if(this.subscription)this.form=JSON.parse(JSON.stringify(this.subscription));
    if(!this.form.location)this.form.location=[]
    var url = "/styles/osm-bright/style.json"
    var mapInfo = this.dashboard.maps[0]
    this.$nextTick(function () {
      map = new mapboxgl.Map({
        container: 'subscriptionEditMap_'+(this.form.id||'new'),
        center: [mapInfo.centerLng, mapInfo.centerLat],
        style: style,
        zoom: mapInfo.zoom,
        interactive: true
      });
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
        // console.log("mousemove", mapMouseLngLat, mapMousePosition)
      });
      var i
      var points=this.form.location
      for (i in points) {
        var marker=this.addLocation(i,true)
      }

    })

  },
  props: {
    "dashId": Number,
    "subscription":Object,
    "new_subscription":Number,
  },
  components: {},
  computed: {
    strSubmit: function() {
      if(this.new_subscription)return t('Crea')
      else return t('Salva')
    },
    strReset: function() {
      return t('Annulla')
    },
    strName: function() {
      return t('Nome')
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
    strAddTag: function() {
      return t('+')
    },
    dashboard: function() {
      return this.$store.state.dashboards.dashboardsById[this.dashId]
    }
  },
  methods: {
    t,
    validate,
    validateRaw,
    call,
    addLocation(locationIndex,notAddFormLocation) {

      var center = map.getCenter()
      var location=this.form.location[locationIndex]||{
        lat: center.lat,
        lng: center.lng
      }
      console.log("addLocation(locationIndex,notAddFormLocation)",locationIndex,notAddFormLocation,this.form.location,location)
      var ll = new mapboxgl.LngLat(location.lng,location.lat)
      if(!notAddFormLocation)this.form.location.push(location)

      var el = document.createElement('div');
      el.className = 'marker';

      var marker = new mapboxgl.Marker(el, { })
        .setLngLat(ll)
        .addTo(map);
      // marker.input = this.form.location[this.form.location.length - 1]
      marker.input = location
      el.onmousedown = function() {
        activeMarker = marker
        map.dragPan.disable();
      };
      el.onmouseup = function() {
        activeMarker = false
        map.dragPan.enable();
      };
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
    submitForm() {
      this.waiting=true;
      if(this.new_subscription)call('dashboards','createSubscription',this.form,this.succ,this.err)
      else call('dashboards','updateSubscription',this.form,this.succ,this.err)
    },
    validateForm() {
      if(this.new_subscription)this.validation=validate('dashboards','createSubscription',this.form)
      else this.validation=validate('dashboards','updateSubscription',this.form)
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
      this.success = t('Subscription creato con successo')
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

<template>
<div class="DashboardEditForm">
  <DashboardMenu :dashboard="dashboard"></DashboardMenu>
  <h2>{{strPageTitle}}</h2>
  <p>{{strPageDescription}}</p>
  <div v-if="dashId" class="dashboardEditMenu"><a :href="'/#/dashboardEdit/'+dashId">Info</a> <a :href="'/#/dashboardEditMaps/'+dashId">Mappe</a> <a :href="'/#/dashboardEditImages/'+dashId">Immagini</a></div>
  <form v-if="dashboard" class="Pic" @click="active=true" @submit.prevent="waiting=true;call('dashboards','updatePic',form,succ,err,false)">
    <div class="pics" v-if="dashboard.pics" v-for="(item,index) in dashboard.pics">
      <div class="pic"><img :src="`${$store.state.apiServer}/dashboards/getPic/id/${item}`" /></div>
    </div>
    <!-- {{dashboard.pics}} -->
    <!-- <div class="pic"><img :src="`${$store.state.apiServer}/dashboards/getPic/id/${dashboard.id}/size/medium/${dashboard.random||0}`" /></div> -->
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
  <pre>{{form}}</pre>
</div>
</template>

<script>
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
import InputFile from './InputFile'

export default {
  name: 'Pic',
  components: {
    InputFile,
    DashboardMenu
  },
  mounted() {
    if (this.dashboard) {
      this.form.id = this.dashboard.id
      this.dashboardSetted = true
    }
  },
  watch: {
    dashboard: function(val) {
      if (!this.dashboardSetted) {
        this.form.id = this.dashboard.id
        this.dashboardSetted = true
      }
    }
  },
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
      if (this.dashId) {
        this.$store.dispatch('dashboards/loadDashboard', {
          dashId: this.dashId
        })
        return this.$store.getters["dashboards/getDashboard"](this.dashId)
      }
    }
  },
  data() {
    return {
      // dashboard: this.$store.state.dashboards,
      form: {
        id: this.$store.state.dashboards.id
      },
      str: {
        pic: t('Immagine'),
        save: t('Salva')
      },
      strPh: {
        pic: t('')
      },
      active: false,
      error: false,
      success: false,
      waiting: false,
      errors: false,
      validation: {
        errors: {}
      }
    }
  },
  methods: {
    validate,
    t,
    call,
    err(msg, extra = false) {
      this.error = this.errors = this.waiting = false
      setTimeout(() => this.error = t(msg), 1)
      setTimeout(() => this.errors = extra.errors, 1)
      this.$emit("error")
    },
    succ(body) {
      this.waiting = false
      // this.$store.dispatch('dashboards/update', {
      //   mutation: 'PIC_UPDATED',
      //   payload: this.form
      // })
      this.$store.commit('dashboards/CHANGE_DASHBOARD_RANDOM', {
        dashId: this.dashId,
        random: Math.random()
      })
      this.success = t('Immagine Aggiornata')
      setTimeout(() => this.$emit("success"), 2000)
    }
  }
}
</script>

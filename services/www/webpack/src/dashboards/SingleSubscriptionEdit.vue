<template>
<div class="DashboardSubscriptionEditForm">
  <!-- <div class="editIntro" v-if="show==='editIntro'"><a class="button" @click="show='editForm'">{{strDashboardsEdit}}</a></div>
  <div class="editForm" v-if="show==='editForm'"> -->
  <form class="Edit" @click="active=true" @submit.prevent="submitForm()" @input="validateForm()" :class="{validForm:validation.valid,activeForm:active}">
    <!-- <div><input class="name" placeholder="Nome" :disabled="waiting" type="text" v-model="form.name" :class="{notValid:validation.errors.name}" /></div> -->
    <div v-for="(role, index) in dashboard.roles">
      <label><input  :disabled="waiting" type="radio" :value="index" v-model="form.roleId" :class="{notValid:validation.errors.roleId}" />{{role.name}}</label>
    </div>
    #<input placeholder="Tags" :disabled="waiting" type="text" v-model="newtag" :class="{notValid:!newtag||tagValidation.errors['']}" @input="tagValidation=validateRaw({'type':'string','minLength': 3},newtag)" />
    <input type="button" class="button" @click="addTag(newtag)" :disabled="!newtag||tagValidation.errors['']" value="aggiungi tag"></input>
    <a v-for="(item, index) in dashboard.subscriptionsMeta.tags" v-if="form.tags.indexOf(clearTag(item[0]))===-1" class="button" @click="addTag(item[0])">{{item[0]}}</a>
    <ul class="tags">
      <li v-for="(item, index) in form.tags">
        #{{ item }} <a class="button" @click="removeTag(item)">X</a>
      </li>
    </ul>
    <input type="reset" class="annulla button" :disabled="waiting" :class="{error,success,waiting}" value="Annulla" @click="show='editIntro'">
    <input type="submit" class="edit button" :disabled="waiting" :class="{error,success,waiting}" value="Salva">
    <div v-if="success" class="success" v-html="success"></div>
    <div v-if="error" class="error" v-html="error"></div>
    <div v-if="errors" class="errors">
      <div v-for="(fieldErrors,fieldName) in errors" class="fieldErrors">
        <div v-for="error in fieldErrors" class="error"><strong>{{fieldName}}</strong> {{t(error)}}</div>
      </div>
    </div>
  </form>
  {{form}}
  <!-- </div> -->
</div>

</div>
</template>
<script>
import {
  validate,
  validateRaw,
  call
} from '@/api'


export default {
  name: 'DashboardSubscriptionEdit',
  props: {
    "subscription": Object,
    "newSubscription": Number
  },
  components: {},
  computed: {
    dashboard: function() {
      return this.$store.state.dashboards.dashboardsById[this.subscription.dashId]
    }
  },
  methods: {
    t(string) {
      return this.$store.getters['dashboards/t'](string)
    },
    validate,
    validateRaw,
    call,
    addTag(tag) {
      tag = tag.replace("#", "")
      if (this.form.tags.indexOf(tag) < 0) this.form.tags.push(tag || "")
    },
    clearTag(tag) {
      return tag.replace("#", "")
    },
    removeTag(tag) {
      var index = this.form.tags.indexOf(tag);
      if (index > -1) this.form.tags.splice(index, 1);
    },
    submitForm() {
      this.waiting = true;
      if (this.newSubscription) call('dashboards', 'subscriptionsCreate', this.form, this.succ, this.err)
      else call('dashboards', 'updateSubscription', this.form, this.succ, this.err)
    },
    validateForm() {
      if (this.newSubscription) this.validation = validate('dashboards', 'subscriptionsCreate', this.form)
      else this.validation = validate('dashboards', 'updateSubscription', this.form)
    },
    err(msg, extra = false) {
      this.error = this.errors = this.waiting = false
      setTimeout(() => this.error = this.t(msg), 1)
      setTimeout(() => this.errors = extra.errors, 1)
      this.$emit("error")
    },
    succ(body) {
      this.waiting = false
      // this.$store.commit('users/REGISTERED', body)
      this.success = this.t('Iscrizione aggiornata')
      setTimeout(() => this.$emit("success"), 2000)
    }
  },
  data() {
    return {
      form: JSON.parse(JSON.stringify(this.subscription)),
      newtag: "",
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

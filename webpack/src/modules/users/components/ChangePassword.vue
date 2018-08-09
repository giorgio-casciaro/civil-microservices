<template>
<ApiForm :v-model="form" v-on:update:state="apiFormData = $event" service="users" method="changePassword" v-on:success="$emit('success',$event)" v-on:error="$emit('error',$event)" :successString="getter_t('Registrazione avvenuta con successo')" :errorString="getter_t('Problemi durante la registrazione')">
  <ApiFormField name="email" v-bind:apiFormData="apiFormData">
    <label v-if="!this.setEmail"><strong>{{getter_t('Email')}}</strong><input :placeholder="getter_t('email@esempio.com')"  type="email" v-model="form.email" /></label>
  </ApiFormField>
  <ApiFormField name="oldPassword" v-bind:apiFormData="apiFormData">
    <label><strong>{{getter_t('Vecchia Password')}}</strong><input v-model="form.oldPassword"   type="password"/></label>
  </ApiFormField>
  <ApiFormField name="password" v-bind:apiFormData="apiFormData">
    <label><strong>{{getter_t('Nuova Password')}}</strong><input v-model="form.password"   type="password"/></label>
  </ApiFormField>
  <ApiFormField name="confirmPassword" v-bind:apiFormData="apiFormData">
    <label><strong>{{getter_t('Conferma Nuova Password')}}</strong><input v-model="form.confirmPassword"    type="password"/></label>
  </ApiFormField>
  <input type="submit" class="assignPassword button" :value="getter_t('Assegna password')">
</ApiForm>
</template>


<script>
import moduleMixin from '../moduleMixin'
export default {
  mixins: [moduleMixin],
  created() {
    if (this.setEmail) this.form.email = this.setEmail
  },
  props: ['setEmail'],
  data() {
    return {
      apiFormData: {},
      form: {
        id: this.$store.state.users.currentUser.id,
        oldPassword: undefined,
        password: undefined,
        confirmPassword: undefined,
      }
    }
  }
}
</script>

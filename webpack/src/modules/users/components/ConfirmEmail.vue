<template>
<ApiForm :v-model="form" v-on:update:state="apiFormData = $event" service="users" method="confirmEmail" v-on:success="$emit('success',$event)" v-on:error="$emit('error',$event)" :successString="getter_t('Registrazione avvenuta con successo')" :errorString="getter_t('Problemi durante la registrazione')">
  <ApiFormField name="email" v-bind:apiFormData="apiFormData">
    <label v-if="!this.setEmail"><strong>{{getter_t('Email')}}</strong><input :placeholder="getter_t('email@esempio.com')"  type="email" v-model="form.email" /></label>
  </ApiFormField>
  <ApiFormField name="emailConfirmationCode" v-bind:apiFormData="apiFormData">
    <label><strong>{{getter_t('Codice conferma email')}}</strong><input v-model="form.emailConfirmationCode"  type="text"/></label>
  </ApiFormField>
  <input type="submit" class="confirm button" :value="getter_t('Conferma')">
</ApiForm>
</template>


<script>
import moduleMixin from '../moduleMixin'
export default {
  mixins: [moduleMixin],
  created () {
    if (this.setEmail) this.form.email = this.setEmail
    if (this.setEmailConfirmationCode) this.form.emailConfirmationCode = this.setEmailConfirmationCode
  },
  mounted(){
    if (this.setEmail && this.setEmailConfirmationCode){
      //SUBMIT
    }
  },
  props:['setEmail','setEmailConfirmationCode'],
  data() {
    return {
      apiFormData: {},
    form: { emailConfirmationCode: '', email: '' }
    }
  }
}
</script>

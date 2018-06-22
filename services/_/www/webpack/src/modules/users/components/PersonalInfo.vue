<template>
<ApiForm logged="1" :v-model="form"  v-on:update:state="apiFormData = $event" service="users" method="updatePersonalInfo" v-on:success="$emit('success',$event)" v-on:error="$emit('error',$event)" :successString="getter_t('Registrazione avvenuta con successo')" :errorString="getter_t('Problemi durante la registrazione')">
    <ApiFormField name="firstName" v-bind:apiFormData="apiFormData" ><label ><strong>{{getter_t('Nome')}}</strong><input v-model="form.firstName"  type="text" /></label></ApiFormField>
    <ApiFormField name="lastName" v-bind:apiFormData="apiFormData" ><label ><strong>{{getter_t('Cognome')}}</strong><input v-model="form.lastName" type="text" /></label></ApiFormField>
    <ApiFormField name="birth" v-bind:apiFormData="apiFormData" ><label ><strong>{{getter_t('Data di nascita (dd/MM/yy GGGGG)')}}</strong><InputDate :timestamp.sync="form.birth" /></label></ApiFormField>
    <input type="submit" class="save button" :value="getter_t('Salva')">
</ApiForm>

</template>


<script>
import InputDate from './InputDate'
import moduleMixin from '../moduleMixin'
export default {
  mixins: [moduleMixin],
  components:{InputDate},
  data() {
    if (!this.$store.state.users.currentUser)return{}
    return {
      form:{
        id: this.$store.state.users.currentUser.id,
        firstName: this.$store.state.users.currentUser.firstName||undefined,
        lastName: this.$store.state.users.currentUser.lastName||undefined,
        birth: this.$store.state.users.currentUser.birth||undefined
      },
      apiFormData:{}
    }
  }
}
</script>

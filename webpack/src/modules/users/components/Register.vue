<template>
<ApiForm :v-model="form"  v-on:update:state="apiFormData = $event" service="users" method="create" v-on:success="$emit('success',$event)" v-on:error="$emit('error',$event)" :successString="getter_t('Registrazione avvenuta con successo')" :errorString="getter_t('Problemi durante la registrazione')">
    <ApiFormField name="email" v-bind:apiFormData="apiFormData" ><input :placeholder="getter_t('Email')" type="email" v-model="form.email" /></ApiFormField>
    <ApiFormField name="password" v-bind:apiFormData="apiFormData" ><input :placeholder="getter_t('Password')" type="password" v-model="form.password" /></ApiFormField>
    <ApiFormField name="confirmPassword" v-bind:apiFormData="apiFormData" ><input :placeholder="getter_t('confirmPassword')" type="password" v-model="form.confirmPassword" /></ApiFormField>
    <input type="submit" class="register button" :value="getter_t('Registrati')">
</ApiForm>
</template>


<script>
import moduleMixin from '../moduleMixin'
export default {
  mixins: [moduleMixin],
  data() {
    return {
      apiFormData:{},
      form: {
        email: '',
        password: '',
        confirmPassword: ''
      }
    }
  }
}
</script>

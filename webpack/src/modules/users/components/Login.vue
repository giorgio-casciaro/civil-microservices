<template>
<ApiForm  :v-model="form"  v-on:update:state="apiFormData = $event" service="users" method="login" v-on:success="$store.dispatch('users/login',{id:$event.id,token:$event.data.token,rememberMe:form.rememberMe});$emit('success',$event)" v-on:error="$emit('error',$event)" :successString="getter_t('Login avvenuto con successo')" :errorString="getter_t('Problemi durante il login')">
    <ApiFormField name="email" v-bind:apiFormData="apiFormData" ><label ><strong>{{getter_t('Email')}}</strong><input v-model="form.email"  type="text" /></label></ApiFormField>
    <ApiFormField name="password" v-bind:apiFormData="apiFormData" ><label ><strong>{{getter_t('Password')}}</strong><input v-model="form.password" type="password" /></label></ApiFormField>
    <ApiFormField name="rememberMe" v-bind:apiFormData="apiFormData" ><label ><strong>{{getter_t('Ricordami')}}</strong><input  v-model="form.rememberMe" type="checkbox" /></label></ApiFormField>
    <a class="lostPassword">{{getter_t('Hai dimenticato la password?')}}</a>
    <input type="submit" class="login button" :value="getter_t('Login')">
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
        rememberMe: true
      }
    }
  }
}
</script>
<style scoped>

</style>

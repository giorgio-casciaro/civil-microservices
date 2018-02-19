<template>
<section class="Registration">
  <div v-if="step==='Register'">
    <header>
      <h3 v-html="strTitleRegister"></h3>
      <p v-html="strDescriptionRegister"></p>
    </header>
    <Register @success="goToStep('ConfirmEmail','/registration/ConfirmEmail/',$store.state.users.currentUser.email)"></Register>
  </div>
  <div v-if="step==='ConfirmEmail'">
    <header>
      <h3 v-html="strTitleConfirmEmail"></h3>
      <p v-html="strDescriptionConfirmEmail"></p>
    </header>
    <ConfirmEmail @success="goToStep('AssignPassword','/registration/AssignPassword/',$store.state.users.currentUser.email)" :setEmail="email" :setEmailConfirmationCode="emailConfirmationCode"></ConfirmEmail>
  </div>
  <div v-if="step==='AssignPassword'">
    <header>
      <h3 v-html="strTitleAssignPassword"></h3>
      <p v-html="strDescriptionAssignPassword"></p>
    </header>
    <AssignPassword @success="goToStep('Complete','/registration/Complete/')" :setEmail="email"></AssignPassword>
  </div>
  <div v-if="step==='Complete'">
    <header>
      <h3 v-html="strTitleComplete"></h3>
      <p v-html="strDescriptionComplete"></p>
    </header>
  </div>
</section>
</template>
<script>
import {translate} from '@/i18n'

import AssignPassword from '@/users/AssignPassword'
import ConfirmEmail from '@/users/ConfirmEmail'
import Register from '@/users/Register'
import Login from '@/users/Login'

var t = function (string) { return translate('app', string) }

export default {
  name: 'Registration',
  data() {
    return {
      step: this.$route.params.step||'Register',
      email: this.$route.params.email,
      emailConfirmationCode: this.$route.params.emailConfirmationCode
    }
  },
  components: { AssignPassword, ConfirmEmail, Register, Login },
  computed: {
    strTitleRegister: function () { return t('Registrazione') },
    strDescriptionRegister: function () { return t('Registrati gratis e usa a pieno la piattaforma') },
    strTitleConfirmEmail: function () { return t('Conferma Mail') },
    strDescriptionConfirmEmail: function () { return t('Controlla la tua mail e inserisci di seguito il codice che ti abbiamo inviato') },
    strTitleAssignPassword: function () { return t('Assegna Password') },
    strDescriptionAssignPassword: function () { return t('Scegli la tua password') },
    strTitleComplete: function () { return t('Complimenti, registrazione completata con successo') },
    strDescriptionComplete: function () { return t('Inizia ad usare a pieno l\'app') },
  },
  methods: { t,
  goToStep(step,url,email=''){
    this.$router.push(url+email)
    this.step=step
    this.email=email
  }
}
}

</script>

<template>
<section class="Registration">
  <div v-if="step==='Register'">
    <header>
      <h3 v-html="getter_t('Registrazione')"></h3>
      <p v-html="getter_t('Registrati gratis e usa a pieno la piattaforma')"></p>
    </header>
    <Register @success="goToStep('ConfirmEmail','/registration/ConfirmEmail/',$store.state.users.currentUser.email)"></Register>
  </div>
  <div v-if="step==='ConfirmEmail'">
    <header>
      <h3 v-html="getter_t('Conferma Mail')"></h3>
      <p v-html="getter_t('Controlla la tua mail e inserisci di seguito il codice che ti abbiamo inviato')"></p>
    </header>
    <ConfirmEmail @success="goToStep('AssignPassword','/registration/AssignPassword/',$store.state.users.currentUser.email)" :setEmail="email" :setEmailConfirmationCode="emailConfirmationCode"></ConfirmEmail>
  </div>
  <div v-if="step==='AssignPassword'">
    <header>
      <h3 v-html="getter_t('Assegna Password')"></h3>
      <p v-html="getter_t('Scegli la tua password')"></p>
    </header>
    <AssignPassword @success="goToStep('Complete','/registration/Complete/')" :setEmail="email"></AssignPassword>
  </div>
  <div v-if="step==='Complete'">
    <header>
      <h3 v-html="getter_t('Complimenti, registrazione completata con successo')"></h3>
      <p v-html="getter_t('Inizia ad usare a pieno l\'app')"></p>
    </header>
  </div>
</section>
</template>
<script>
import AssignPassword from '@/modules/users/components/AssignPassword'
import ConfirmEmail from '@/modules/users/components/ConfirmEmail'
import Register from '@/modules/users/components/Register'
import Login from '@/modules/users/components/Login'
import pageMixin from './pageMixin'

export default {
  mixins: [pageMixin],
  data() {
    return {
      step: this.$route.params.step||'Register',
      email: this.$route.params.email,
      emailConfirmationCode: this.$route.params.emailConfirmationCode
    }
  },
  components: { AssignPassword, ConfirmEmail, Register, Login },
  methods: { 
  goToStep(step,url,email=''){
    this.$router.push(url+email)
    this.step=step
    this.email=email
  }
}
}

</script>

import ApiForm from '@/components/ApiForm'
import ApiFormField from '@/components/ApiFormField'
import { mapMutations, mapGetters, mapActions } from 'vuex'
import storeModule from './store'
const mapWithPrefix = (obj, prefix, moduleName = 'users') => Object.keys(obj).reduce((a, b) => Object.assign(a, {[prefix + '_' + b]: moduleName + '/' + b}), {})

export default {
  components: { ApiForm, ApiFormField },
  computed: { ...mapGetters(mapWithPrefix(storeModule.getters, 'getter')) },
  methods: {
    log (msg, obj) { console.log(msg, obj) },
    ...mapMutations(mapWithPrefix(storeModule.mutations, 'mutation')),
    ...mapActions(mapWithPrefix(storeModule.actions, 'action'))
  }
}

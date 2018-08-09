<template>
<ApiQuery queryId="usersList" v-on:update:state="apiQueryData = $event" service="users" method="list">
  <div slot-scope="scope">
    {{scope.viewId}}
    <ApiView :viewId="scope.viewId" service="users">
      <div slot-scope="view">{{view}}</div>
    </ApiView>{{scope.viewId}}</div>
</ApiQuery>
</template>


<script>

import ApiQuery from '@/components/ApiQuery'
import ApiView from '@/components/ApiView'
import moduleMixin from '../moduleMixin'
export default {
  mixins: [moduleMixin],
  components:{ApiQuery,ApiView},

  data() {
    return {
      apiQueryData: {}
    }
  }
}
</script>

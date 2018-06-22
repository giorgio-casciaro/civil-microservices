<template>
<ApiQuery queryId="usersList" v-on:update:state="apiQueryData = $event" service="users" method="list">
<div slot-scope="scope">{{scope.item.email}} {{scope.item.id}}</div>
</ApiQuery>
</template>


<script>

import ApiQuery from '@/components/ApiQuery'
import moduleMixin from '../moduleMixin'
export default {
  mixins: [moduleMixin],
  components:{ApiQuery},

  data() {
    return {
      apiQueryData: {}
    }
  }
}
</script>

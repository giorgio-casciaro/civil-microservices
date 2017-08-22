var defaultFilters = require('../defaultFilters')
module.exports = {
  KUBELOG: {
    grok: '%{WORD:level}: %{INT:year}/%{INT:month}/%{INT:day} %{INT:hour}:%{INT:minute}:%{NUMBER:second} %{WORD:type} %{WORD:subtype} {%{GREEDYDATA:jsonLog}} {%{GREEDYDATA:jsonLogSecondary}}',
    filter: function (obj) { obj.test2 = 'OK'; return obj }
  },
  BASELOG: {
    grok: '%{GREEDYDATA:log}'
    // filter: function (obj) { obj.test2 = 'OK'; return obj }
  },
  ELASTICSEARCHLOG: {
    grok: '%{GREEDYDATA:log}'
    // filter: function (obj) { obj.test2 = 'OK'; return obj }
  }

}

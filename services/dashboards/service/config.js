var path = require('path')
var fs = require('fs')
module.exports = {
  service: {
    serviceName: process.env.serviceName || 'schema'
  },
  schemaHost: process.env.schemaHost || 'http://127.0.0.1:10000',
  confirmEmailUrl: process.env.confirmEmailUrl || 'http://127.0.0.1:10080/#/confirmEmailUrl',
  sendEmails: process.env.sendEmails || true,
  mailFrom: process.env.mailFrom || 'notifications@civilconnect.it',
  uploadPath: process.env.uploadPath || '/upload/',
  smtp: process.env.smtpConfigJson ? JSON.parse(process.env.smtpConfigJson) : {
    host: '127.0.0.1',
    port: 1025,
    secure: false,
    debug: true
  },
  jwt: {
    // 'passphrase': process.env.jwtPassphrase || 'CJhbGciOiJIUzI1NiJ9eyJ0eXAiOiJKV1QiL',
    'path': path.join(__dirname, './permissions/'),
    'privateCert': process.env.jwtPrivateCert || fs.readFileSync(path.join(__dirname, './server.key')),
    'publicCert': process.env.jwtPublicCert || fs.readFileSync(path.join(__dirname, './server.cert'))
  },
  aerospike: {
    hosts: process.env.aerospikeHosts || '127.0.0.1:3000',
    // log: {level: process.env.aerospikeLogLevel || 4},
    set: process.env.aerospikeSet || 'dashboards',
    metaSet: process.env.aerospikeMetaSet || 'dashboardsMeta',
    mutationsSet: process.env.aerospikeMutationsSet || 'dashboardsMutations',
    subscriptionsSet: process.env.aerospikeSubscriptionsSet || 'subscriptions',
    subscriptionsMetaSet: process.env.aerospikeSubscriptionsMetaSet || 'subscriptionsMeta',
    subscriptionsMutationsSet: process.env.aerospikeSubscriptionsMutationsSet || 'subscriptionsMutations',
    rolesSet: process.env.aerospikeRolesSet || 'roles',
    rolesMutationsSet: process.env.aerospikeRolesMutationsSet || 'rolesMutations',
    filesSet: process.env.aerospikeFilesSet || 'files',
    filesChunksSet: process.env.aerospikeFilesChunksSet || 'filesChunks',
    viewsSet: process.env.aerospikeViewsSet || 'dashboardsViews',
    namespace: process.env.aerospikeNamespace || 'cc_dashboards',
    policies: { timeout: parseInt(process.env.aerospikeTimeout) || 600000 }
  },
  aerospikePosts: {
    hosts: process.env.aerospikeHosts || '127.0.0.1:3000',
    // log: {level: process.env.aerospikeLogLevel || 4},
    set: process.env.aerospikePostsSet || 'posts',
    metaSet: process.env.aerospikePostsMetaSet || 'postsMeta',
    mutationsSet: process.env.aerospikePostsMutationsSet || 'postsMutations',
    filesSet: process.env.aerospikePostsFilesSet || 'postsFiles',
    filesChunksSet: process.env.aerospikePostsFilesChunksSet || 'postsFilesChunks',
    viewsSet: process.env.aerospikePostsViewsSet || 'postsViews',
    namespace: process.env.aerospikeNamespace || 'cc_dashboards',
    policies: { timeout: parseInt(process.env.aerospikeTimeout) || 600000 }
  },

  console: { error: process.env.consoleError || true, debug: process.env.consoleDebug || false, log: process.env.consoleLog || true, warn: process.env.consoleWarn || true }
}

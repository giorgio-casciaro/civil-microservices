var path = require('path')
var fs = require('fs')
module.exports = {
  service: {
    serviceName: process.env.serviceName || 'schema'
  },
  schemaHost: process.env.schemaHost || 'http://127.0.0.1:10000',
  confirmEmailUrl: process.env.confirmEmailUrl || 'http://127.0.0.1:10080/#/confirmEmailUrl',
  sendEmails: process.env.sendEmails || true,
  mailFrom: process.env.mailFrom || 'notifications1@civilconnect.it',
  uploadPath: process.env.uploadPath || '/upload/',
  smtp: process.env.smtpConfigJson ? JSON.parse(process.env.smtpConfigJson) : {
    host: '127.0.0.1',
    port: 1025,
    secure: false,
    debug: true
  },
  jwt: {
    'passphrase': process.env.jwtPassphrase || 'CJhbGciOiJIUzI1NiJ9eyJ0eXAiOiJKV1QiL',
    'path': path.join(__dirname, './permissions/'),
    'privateCert': process.env.jwtPrivateCert || fs.readFileSync(path.join(__dirname, './server.key')),
    'publicCert': process.env.jwtPublicCert || fs.readFileSync(path.join(__dirname, './server.cert'))
  },
  aerospike: {
    hosts: process.env.aerospikeHosts || '127.0.0.1:3000',
    // log: {level: process.env.aerospikeLogLevel || 4},
    set: process.env.aerospikeSet || 'users',
    mutationsSet: process.env.aerospikeMutationsSet || 'mutations',
    filesSet: process.env.aerospikeFilesSet || 'filesSet',
    filesChunksSet: process.env.aerospikeFilesChunksSet || 'filesChunksSet',
    viewsSet: process.env.aerospikeViewsSet || 'views',
    namespace: process.env.aerospikeNamespace || 'cc_users',
    policies: { timeout: parseInt(process.env.aerospikeTimeout) || 600000 }
  },
  aerospikeNotifications: {
    hosts: process.env.aerospikeHosts || '127.0.0.1:3000',
    // log: {level: process.env.aerospikeLogLevel || 4},
    set: process.env.aerospikeNotificationsSet || 'notifications',
    mutationsSet: process.env.aerospikeMutationsNotificationsSet || 'notificationsMutations',
    viewsSet: process.env.aerospikeNotificationsViewsSet || 'notificationsViews',
    namespace: process.env.aerospikeNotificationsNamespace || 'cc_users',
    policies: { timeout: parseInt(process.env.aerospikeTimeout) || 600000 }
  },
  console: { error: process.env.consoleError || true, debug: process.env.consoleDebug || true, log: process.env.consoleLog || true, warn: process.env.consoleWarn || true }
}

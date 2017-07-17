# civil-microservices

## TODO

smtp email server
logger
  - test settaggio attuale su kubernetes (settings in elasticsearch)
  - labels logMe a containers



- jesus public http dovrebbe aprire solo le route utili e gesire l'upolad dei file con parametri ad hoc per ogni metodo

- i test dovrebbero avvenire tramite chiamata rest

- revoke token: aerospike with autoremove after token expires
- token expires gestiti da users o ms ad hoc? (altri mcroservice chiamano user per verificare token valido)
- token revocato durante l'eliminazione

- prevedere reiscrizione (se user esiste e stato è zero)


- app->i18n->getTranslations("it")
- app->i18n->createRawString("group","rawstring")
- app->i18n->createStringFilter("funztion","CldrLink")
- app->i18n->createTranslatedString("it","rawstring","translated string")



## FRONTEND

- front end client: le chiamate all'api dovrebbero essere registrate e messe in una queue (se la connessione non è disponibile vengono reinviate)
- service worker
-test maps
## JESUS
- ripulire errori di validazione
- prevedere object per error con message per solo stringa
- public http dovrebbe aprire solo le route consentite, l'upload dovrebbe comparire solo sulle route che ne necessitano
- public http dovrebbe fare unn doppio check sui file (magic numbers)

## DOCKERS
- command al post di entrypoint

## ADMIN AREA

- admin get all services schema
- proxy service api call
- test area

  - lista service/method
  - test method call

- input server
- select service/method

## AUTODEPLOY

- from docker compose to kubernetes test
- from kubernetes test to production

## API CLIENT

front end client:

- astrae la gestione delle connessioni con il server e la sincronizzazione dei dati
- gestisce coda di chiamate asyncrone al server
- gestisce streaming in download (events)
- aggiorna il db sul browser
- aggiorna lo store che vue usa per la visualizzazione

feClient.get("service","call",args,cacheTimeout) feClient.getLive("id","service","call",args) feClient.stopLive("id")

front end modular store

- modificato da feClient -> feClientMutations
- modificato da app -> appMutations
- all mutations sended to server on error

front end app -usa lo store in lettura, scrive direttamente sullo store tramite mutations e invia comandi a feClient

### LISTS QUERIES uses cases

- DASHBOARDS
  - all public dashboards
  - most popular dashboards: secondary index numero di iscritti
  - my dashboards: query a dashboards, dashboards contiene tabella user con iscrizioni alle dashboards

- POSTS
  - all posts from dashboard x
    - all public posts from dashboard x: indirizzo @dashboardx
    - all posts sended to me from dashboard x : indirizzo me@dashboardx
    - all posts sended to my user's tags from dashboard x : indirizzo #tag@dashboardx

- USERS

  - all users from dashboard x : alias @dashboard
  - all users from dashboard x tag y : alias #y@dashboard
  - all users tags/groups from dashboard x : tags e gruppi direttamente in dashboard

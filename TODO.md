# civil-microservices
updaate jesus

## SERVICES

## APP
  - map: controllare test online e 127.0.0.1 su locale (non 8080)
  - smtp server
  - logger
  -
## NGINX
  - add cache minima su pagine base
  - cache alta su maps
  - compress gzip su tutto

## DOMAIN
posts
  - post: id, messaggio

dashboards
  - dashs: id, nome, descrizione, area di interesse, public
  - iscrizioni: userid, dash id, and dash setting
  - iscrizione a dashboard: userid, dash id, tags, user dash setting

### LISTS QUERIES uses cases
- DASHBOARDS
  - all public dashboards
  - most popular dashboards: secondary index numero di iscritti
  - my dashboards: query a iscrizioni dashboards

- POSTS
  - all posts from dashboard x
    - all public posts from dashboard x: indirizzo @dashboardx, secondary index su destinatari
    - all posts sended to me from dashboard x : indirizzo me@dashboardx, secondary index su destinatari
    - all posts sended to my user's tags from dashboard x : indirizzo #tag@dashboardx, secondary index su destinatari

- USERS
  - all users from dashboard x : alias @dashboard
  - all users from dashboard x tag y : alias #y@dashboard
  - all users tags/groups from dashboard x : tags e gruppi direttamente in dashboard


## PERMISSIONS
- revoke token: aerospike with autoremove after token expires
- token expires gestiti da users o ms ad hoc? (altri mcroservice chiamano user per verificare token valido)
- token revocato durante l'eliminazione

## USERS
- prevedere reiscrizione (se user esiste e stato è zero)

## STRINGS
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

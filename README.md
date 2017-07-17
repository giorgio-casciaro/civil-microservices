# civil-microservices

dev swarn
docker swarm join \
   --token SWMTKN-1-15c7u9cfdctzg10bjtk8igjvaa8viroi75q9fvv48c5fmkqi8v-8fa5blxn4217pm3swv0776662 \
   192.168.1.208:2377


npm start
start a local test
fa partire servizi di base


docker-compose up SERVICE
./SERVICE/npm run test
./SERVICE/npm run test_watch
./SERVICE/npm run build_modules
./SERVICE/npm run build


docker-compose run users --entrypoint "sh -c \"cd /service/ && npm run watch_test\""



sudo docker stack deploy -c docker-compose.prod.yml civil

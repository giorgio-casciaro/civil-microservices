#/bin/bash
#
# #docker stop mongo
# docker stop elas
# docker stop aerospike
#
# #docker rm mongo
# docker rm elas
# docker rm aerospike
#
# #docker run -d --name mongo -p 27017:27017 mvertes/alpine-mongo
# # docker run -d --name elas elasticsearch -Etransport.host=0.0.0.0 -Ediscovery.zen.minimum_master_nodes=1
# docker run -d -v "$PWD/aerospike.conf":"/etc/aerospike/aerospike.conf" --name aerospike -p 3000:3000 -p 3001:3001 -p 3002:3002 -p 3003:3003 aerospike/aerospike-server
docker-compose down -v
docker-compose down
docker network prune --force
sleep 1

sudo sysctl -w vm.max_map_count=262144
# docker run  --name elas -p 9200:9200 -p 9300:9300 itzg/elasticsearch:latest
cd aerospike
docker-compose up -d aerospike
cd ..

# docker-compose up -d elasticsearch
docker-compose up -d smtp
docker-compose up -d schema
echo 'docker-compose stop schema ; docker-compose run --entrypoint "sh -c \"cd /service/ && npm run watch_start\"" schema'

sleep 10
docker-compose up -d app
echo 'docker-compose stop app; docker-compose up app'
echo 'docker-compose run --entrypoint "sh -c \"cd /service/ && npm run watch_start\"" app'
docker-compose up -d users
echo 'docker-compose stop users; docker-compose up users'
echo 'docker-compose run --entrypoint "sh -c \"cd /service/ && npm run watch_start\"" users'
# docker-compose up -d deploy
#echo 'docker-compose stop deploy ; docker-compose run --entrypoint "sh -c \"cd /service/ && npm run watch_start\"" deploy'
docker-compose up -d  www
# while true; do sleep 60; wget -q http://127.0.0.1:10080/api/app/getPublicApiSchema -O ./www/webpack/src/api.schema.json; done &
xdg-open http://127.0.0.1:10080/static/app/ &
# # xdg-open http://127.0.0.1:10080/ &
cd www/webpack
npm run dev
cd ../..

# docker-compose up  users
# docker-compose run www
# docker-compose up -d app
# docker-compose run users
# docker-compose run --entrypoint "sh -c \"cd /service/ && npm run watch_test\"" users
# docker-compose run --entrypoint "sh -c \"cd /service/ && npm run watch_start\"" users
# docker-compose run --entrypoint "sh " www
# docker-compose up aerospike-amc  &

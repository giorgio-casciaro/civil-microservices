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
docker-compose  \
 -f ./services/aerospike/docker-compose.yml \
 -f ./services/app/docker-compose.yml \
 -f ./services/schema/docker-compose.yml \
 -f ./services/users/docker-compose.yml \
 -f ./services/www/docker-compose.yml \
 down

docker network prune --force
sleep 1

sudo sysctl -w vm.max_map_count=262144

docker-compose  \
 -f ./services/aerospike/docker-compose.yml \
 -f ./services/app/docker-compose.yml \
 -f ./services/schema/docker-compose.yml \
 -f ./services/users/docker-compose.yml \
 -f ./services/www/docker-compose.yml \
 up aerospike schema app users



# docker-compose  \
# -f ./services/aerospike/docker-compose.yml \
# -f ./services/app/docker-compose.yml \
# -f ./services/schema/docker-compose.yml \
# -f ./services/users/docker-compose.yml \
# -f ./services/www/docker-compose.yml \
# up app
#& sh start_webpack_dev.sh
# while true; do sleep 60; wget -q http://127.0.0.1:10080/api/app/getPublicApiSchema -O ./www/webpack/src/api.schema.json; done &
# xdg-open http://127.0.0.1:81/static/app/
# cd www/webpack
# npm run dev
# cd ../..

# docker-compose up  users
# docker-compose run www
# docker-compose up -d app
# docker-compose run users
# docker-compose run --entrypoint "sh -c \"cd /service/ && npm run watch_test\"" users
# docker-compose run --entrypoint "sh -c \"cd /service/ && npm run watch_start\"" users
# docker-compose run --entrypoint "sh " www
# docker-compose up aerospike-amc  &

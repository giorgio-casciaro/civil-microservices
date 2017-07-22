#/bin/bash
DIR=$(dirname "$(readlink -f "$0")")
cd $DIR
$TERM -e 'sh webpack.sh' &
cd $DIR/..

services_compose=""
for dir in ./services/*
do
 serviceName=$(basename $dir)
 file="${dir}/config/docker-compose.yml"
 if [ -f "$file" ]; then services_compose="$services_compose -f $file" ;fi
done
bash -c "docker-compose $services_compose down"

docker network prune --force
sleep 1

sudo sysctl -w vm.max_map_count=262144

bash -c "docker-compose $services_compose up"


# docker-compose  \
#  -f ./services/aerospike/docker-compose.yml \
#  -f ./services/app/docker-compose.yml \
#  -f ./services/schema/docker-compose.yml \
#  -f ./services/users/docker-compose.yml \
#  -f ./services/www/docker-compose.yml \
#  up aerospike schema app users

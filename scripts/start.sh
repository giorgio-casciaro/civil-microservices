#/bin/bash
DIR=$(dirname "$(readlink -f "$0")")

services_compose=""
for dir in ./services/*
do
 serviceName=$(basename $dir)
 file="${dir}/config/docker-compose.yml"
 if [ -f "$file" ]; then services_compose="$services_compose -f $file" ;fi
done

if [ -z "$1" ];
  then
    cd $DIR
    $TERM -e 'sh webpack.sh' &
    cd $DIR/..
    bash -c "docker-compose $services_compose down"
    docker network prune --force
    sleep 1
    sudo sysctl -w vm.max_map_count=262144
fi

bash -c "docker-compose $services_compose up $1"

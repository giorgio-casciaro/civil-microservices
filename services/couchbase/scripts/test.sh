#!/bin/bash
set -x
DIR=$(dirname "$(readlink -f "$0")")
cd $DIR/../config/
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker-compose up --force-recreate --remove-orphans

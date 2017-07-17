#!/bin/bash
#set -x
RAW_IMAGE_NAME=$(cat "$PWD/../info/service.image")
RAW_NAME=$(cat "$PWD/../info/service.name")
IMAGE_NAME_LATEST="$RAW_IMAGE_NAME:latest";

docker build  -t $RAW_IMAGE_NAME  -f "./docker/Dockerfile" .
docker stop $RAW_NAME
docker rm $RAW_NAME
#DOCKER CONTAINER

docker run -it --name $RAW_NAME $MICROSERVICE_DOCKER_IMAGE_NAME
echo "docker exec -i -t $RAW_NAME /bin/bash "
echo "docker push $MICROSERVICE_DOCKER_IMAGE_NAME "

# docker stop $RAW_NAME
# docker run -d --name $RAW_NAME $IMAGE_NAME_LATEST /bin/bash
# docker exec -it $RAW_NAME /bin/bash

# docker push $IMAGE_NAME
# echo $VERSION > $PWD/../info/service.version
# find -s "$PWD/../service" -type f -exec md5sum {} \; | md5sum > $PWD/../info/service.hash

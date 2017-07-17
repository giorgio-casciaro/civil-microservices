#!/bin/bash
#set -x
MICROSERVICE_ID="civil-microservices-mapserver";
MICROSERVICE_DOCKER_IMAGE_NAME="giorgiocasciaro/civil-microservices-mapserver:v1";

# cd docker
docker build --tag $MICROSERVICE_ID -t $MICROSERVICE_DOCKER_IMAGE_NAME  -f "./Dockerfile" ..
docker stop $MICROSERVICE_ID
docker rm $MICROSERVICE_ID

#DOCKER CONTAINER
echo "docker exec -i -t --user $MICROSERVICE_USER $MICROSERVICE_ID /bin/bash "
echo "docker push $MICROSERVICE_DOCKER_IMAGE_NAME "

# docker run -it --net="host" --name $MICROSERVICE_ID $MICROSERVICE_DOCKER_IMAGE_NAME

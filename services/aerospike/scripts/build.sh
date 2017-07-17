#!/bin/bash
#set -x
RAW_VERSION=$(cat "$PWD/../info/service.version")
VERSION="$((RAW_VERSION + 1))"
RAW_IMAGE_NAME=$(cat "$PWD/../info/service.image")
IMAGE_NAME="$RAW_IMAGE_NAME:$VERSION";
IMAGE_NAME_LATEST="$RAW_IMAGE_NAME:latest";
echo $IMAGE_NAME
docker build -t $IMAGE_NAME  -t $IMAGE_NAME_LATEST  -f "$PWD/../Dockerfile" $PWD/..
echo "docker  exec -it  $IMAGE_NAME_LATEST  bin/bash"

# docker push $IMAGE_NAME
# echo $VERSION > $PWD/../info/service.version
# find -s "$PWD/../service" -type f -exec md5sum {} \; | md5sum > $PWD/../info/service.hash

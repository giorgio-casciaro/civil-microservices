#!/bin/bash
#set -x
DIR=$(dirname "$(readlink -f "$0")")
RAW_VERSION=$(cat "$DIR/../info/service.version")
RAW_IMAGE_NAME=$(cat "$DIR/../info/service.image")
IMAGE_NAME="$RAW_IMAGE_NAME:$RAW_VERSION";
IMAGE_NAME_LATEST="$RAW_IMAGE_NAME:latest";
echo $IMAGE_NAME
docker build -t $IMAGE_NAME  -t $IMAGE_NAME_LATEST  -f "$DIR/../Dockerfile" $DIR/..
docker push $IMAGE_NAME
echo "$((RAW_VERSION + 1))" > $DIR/../info/service.version

#!/bin/bash
#set -x
RAW_VERSION=$(cat "./service.version")
RAW_IMAGE_NAME=$(cat "./service.image")
IMAGE_NAME="$RAW_IMAGE_NAME:version-$RAW_VERSION";
echo $IMAGE_NAME
docker push $IMAGE_NAME

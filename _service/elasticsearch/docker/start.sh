#!/bin/bash
#set -x
DIR=$(dirname "$(readlink -f "$0")")
RAW_VERSION=$(cat "../service.version")
RAW_IMAGE_NAME=$(cat "../service.image")
IMAGE_NAME="$RAW_IMAGE_NAME:version-$RAW_VERSION";
echo $IMAGE_NAME
docker stop aerospike
docker rm  aerospike 
docker run -it --net="host" --name aerospike $IMAGE_NAME

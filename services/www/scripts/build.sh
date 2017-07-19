#!/bin/bash
# set -x
DIR=$(dirname "$(readlink -f "$0")")
RAW_VERSION=$(cat "$DIR/../info/service.version")
RAW_IMAGE_NAME=$(cat "$DIR/../info/service.image")
IMAGE_NAME="$RAW_IMAGE_NAME:$RAW_VERSION";
IMAGE_NAME_LATEST="$RAW_IMAGE_NAME:latest";


#  docker update
echo  "Docker build and push"
docker build -t $IMAGE_NAME  -t $IMAGE_NAME_LATEST  -f "$DIR/../config/Dockerfile" $DIR/..
docker push $IMAGE_NAME

echo  "Update config"
OLD_VERSION=$((RAW_VERSION - 1))
OLD_IMAGE_NAME="$RAW_IMAGE_NAME:$OLD_VERSION";
IMAGE_NAME_ESCAPED=$(echo $IMAGE_NAME | sed -e 's/[\/&]/\\&/g')
OLD_IMAGE_ESCAPED=$(echo $OLD_IMAGE_NAME | sed -e 's/[\/&]/\\&/g' )
sed -i -e "s/${OLD_IMAGE_ESCAPED}/${IMAGE_NAME_ESCAPED}/g" $DIR/../config/*

echo  "Update History"
HISTORY_DIR="$DIR/../history/$RAW_VERSION"
mkdir -p "$HISTORY_DIR"
cp -R "$DIR/../config" "$HISTORY_DIR/config"
cp -R "$DIR/../info" "$HISTORY_DIR/info"

echo  "Update version"
NEW_VERSION=$((RAW_VERSION + 1))
echo "$NEW_VERSION" > $DIR/../info/service.version

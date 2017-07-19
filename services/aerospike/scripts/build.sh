#!/bin/bash
# set -x
DIR=$(dirname "$(readlink -f "$0")")
LAST_VERSION=$(cat "$DIR/../info/service.version")
NEW_VERSION=$((LAST_VERSION + 1))
RAW_IMAGE_NAME=$(cat "$DIR/../info/service.image")
IMAGE_NAME="$RAW_IMAGE_NAME:$NEW_VERSION";
IMAGE_NAME_LATEST="$RAW_IMAGE_NAME:latest";


#  docker update
echo  "Docker build and push"
docker build -t $IMAGE_NAME  -t $IMAGE_NAME_LATEST  -f "$DIR/../config/Dockerfile" $DIR/..
docker push $IMAGE_NAME

echo  "Update config"
OLD_IMAGE_NAME="$RAW_IMAGE_NAME:$LAST_VERSION";
IMAGE_NAME_ESCAPED=$(echo $IMAGE_NAME | sed -e 's/[\/&]/\\&/g')
OLD_IMAGE_ESCAPED=$(echo $OLD_IMAGE_NAME | sed -e 's/[\/&]/\\&/g' )
sed -i -e "s/${OLD_IMAGE_ESCAPED}/${IMAGE_NAME_ESCAPED}/g" $DIR/../config/*

echo  "Update History"
HISTORY_DIR="$DIR/../history/$LAST_VERSION"
mkdir -p "$HISTORY_DIR"
cp -R "$DIR/../config" "$HISTORY_DIR/config"
cp -R "$DIR/../info" "$HISTORY_DIR/info"

echo  "Update version"
echo "$NEW_VERSION" > $DIR/../info/service.version

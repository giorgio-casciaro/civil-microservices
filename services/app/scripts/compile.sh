#!/bin/bash
#set -x
DIR=$(dirname "$(readlink -f "$0")")
docker run -v "$DIR/..":"/microservice"  giorgiocasciaro/ubuntu-node-compiler:v3

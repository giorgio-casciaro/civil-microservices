#!/bin/bash
#set -x
DIR=$(dirname "$(readlink -f "$0")")
docker run -v "$DIR/..":"/service"  giorgiocasciaro/ubuntu-node-compiler:v2

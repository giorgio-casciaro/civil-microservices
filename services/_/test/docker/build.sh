#!/bin/bash
#set -x
DIR=$(dirname "$(readlink -f "$0")")
#
#docker stop "baseServiceCompiler"
docker run -v "$DIR/../":"/service"  giorgiocasciaro/alpine-node-compiler:v2

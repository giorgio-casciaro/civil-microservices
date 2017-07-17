#!/bin/bash
#set -x
#
#docker stop "baseServiceCompiler"
docker run -v "$PWD/../":"/service"  giorgiocasciaro/alpine-node-compiler:v2

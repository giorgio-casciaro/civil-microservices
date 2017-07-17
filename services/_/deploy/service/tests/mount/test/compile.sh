#!/bin/bash
#set -x
docker run -v "$PWD/":"/service"  giorgiocasciaro/ubuntu-node-compiler:v1

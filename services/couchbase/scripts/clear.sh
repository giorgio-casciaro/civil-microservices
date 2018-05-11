#!/bin/bash
set -x
DIR=$(dirname "$(readlink -f "$0")")
sudo rm -rf $DIR/../gitignore/*

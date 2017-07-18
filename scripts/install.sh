#!/bin/bash
#set -x
DIR=$(dirname "$(readlink -f "$0")")
cd $DIR/../NPM
git clone git@github.com:giorgio-casciaro/jesus.git
git clone git@github.com:giorgio-casciaro/cqrs.git

# cd $DIR/../NPM/jesus
# npm install
#
# cd $DIR/../NPM/cqrs
# npm install

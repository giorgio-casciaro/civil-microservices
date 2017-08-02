#!/bin/bash
#set -x
DIR=$(dirname "$(readlink -f "$0")")
sh $DIR/compile.sh

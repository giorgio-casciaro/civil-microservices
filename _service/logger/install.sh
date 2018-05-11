#!/bin/bash
#set -x
DIR=$(dirname "$(readlink -f "$0")")
npm link sint-bit-jesus && npm link sint-bit-cqrs
npm install

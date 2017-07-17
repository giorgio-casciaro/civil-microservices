#!/bin/bash
#set -x
cd $PWD/..
npm link sint-bit-jesus && npm link sint-bit-cqrs
npm install
cd $PWD

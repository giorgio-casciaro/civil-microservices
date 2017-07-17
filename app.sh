#!/bin/bash

echo "\n------ ${1} --------"
for dir in ./services/*
do
 # do something on "$file"
 # cat "$file" >> /var/www/cdn.example.com/cache/large.css
 serviceName=$(basename $dir)
 file="${dir}/scripts/${1}"
 if [ -f "$file" ]
  then
      echo "$serviceName: OK"
  else
      echo "$serviceName: SKIPPED"
  fi
done
echo "\n"

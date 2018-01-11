#!/usr/bin/env bash
/etc/init.d/amc start
sleep 5
while [ 1 ];
do
    tail -f /var/log/amc/amc.log
    sleep 1
done

#!/bin/bash

cd "$(dirname "$0")"

PATH="$PWD/.nodejs_bin/bin:$PATH"

mcsm_pid=0
start_mcsm(){
  node app.js &
  mcsm_pid=$!
  trap 'kill -INT $mcsm_pid 2>&-; wait $mcsm_pid; exit $?' EXIT INT STOP 
}

start_mcsm

while read -a args; do
    if [ "${args[0]}" = "stop" -o "${args[0]}" = "quit" ]; then
        exit
    fi
    if [ "$(jobs)" = "" ]; then
        exit
    fi
done

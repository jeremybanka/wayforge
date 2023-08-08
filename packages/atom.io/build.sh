#!/bin/bash

packages=(
  .
  introspection
  json
  react
  react-devtools
  realtime 
  realtime-react
)

for dir in "${packages[@]}"; do (cd $dir && tsup) & done
wait

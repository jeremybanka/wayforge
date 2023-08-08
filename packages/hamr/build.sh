#!/bin/bash

packages=(
  react-css-vars
  react-elastic-input
  react-error-boundary
  react-id
  react-json-editor
  react-radial
  react-rx
  recoil-combo
  recoil-error-boundary
  recoil-effect-storage
  recoil-tools
)

for dir in "${packages[@]}"; do (cd $dir && tsup) & done
wait

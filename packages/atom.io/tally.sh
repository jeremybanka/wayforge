#!/bin/bash

ignore_imports=false
include_tests=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --ignore-imports|-i)
      ignore_imports=true
      shift
      ;;
    --include-tests|-t)
      include_tests=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

total_lines=0

for file in ./**/*.ts ./**/*.tsx; do
  if [ -f "$file" ]; then
    if ! $include_tests && [[ $file =~ \.(test|spec)\.tsx?$ ]]; then
      continue
    fi

    if $ignore_imports; then
      lines=$(grep -v '^\s*import\s' "$file" | wc -l)
    else
      lines=$(wc -l < "$file")
    fi

    total_lines=$((total_lines + lines))
  fi
done

if $ignore_imports; then
  echo "Total number of lines (excluding import statements): $total_lines"
else
  echo "Total number of lines: $total_lines"
fi
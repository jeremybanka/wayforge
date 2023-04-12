#!/bin/bash

total_lines=0

for file in ./**/*.ts ./**/*.tsx; do
  if [ -f "$file" ]; then
    lines=$(grep -v '^\s*import\s' "$file" | wc -l)
    total_lines=$((total_lines + lines))
  fi
done

echo "Total number of lines (excluding import statements): $total_lines"
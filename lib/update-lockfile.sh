#!/bin/bash

# Verify we're on a renovate/* branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ ! $current_branch == renovate/* ]]; then
    echo "Not on a 'renovate/' branch. Exiting..."
    exit 0
fi

# Check for changes in bun.lockb
if git diff --exit-code --name-only -- bun.lockb; then
    echo "bun.lockb is unchanged."
else
    echo "bun.lockb has changed, committing changes..."
    git config --global user.email "action@github.com"
    git config --global user.name "GitHub Action"
    git add bun.lockb
    git commit -m "📦"
    git push
fi
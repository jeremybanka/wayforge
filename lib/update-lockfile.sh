#!/bin/bash

# Configure Git to recognize the repository as a safe directory
git config --global --add safe.directory "$(pwd)"

# Log the current branch name
echo "Current branch: $GITHUB_HEAD_REF"

# Verify we're on a renovate/* branch
if [[ ! $GITHUB_HEAD_REF == renovate/* ]]; then
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
    git push origin HEAD:refs/heads/"$GITHUB_HEAD_REF"
    gh workflow run integration.yml --ref "$GITHUB_HEAD_REF"
fi
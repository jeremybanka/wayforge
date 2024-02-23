#!/bin/bash

# Configure Git to recognize the repository as a safe directory
git config --global --add safe.directory "$(pwd)"

# Extract the branch name from the GITHUB_REF env variable or fallback to git command
# This assumes the script is run in a GitHub Actions environment
branch_name="${GITHUB_REF##*/}"
if [ -z "$branch_name" ]; then
    branch_name=$(git rev-parse --abbrev-ref HEAD)
fi

# Log the current branch name
echo "Current branch: $branch_name"

# Verify we're on a renovate/* branch
if [[ ! $branch_name =~ ^renovate/ ]]; then
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
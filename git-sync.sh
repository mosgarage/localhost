#!/usr/bin/env bash
# git-sync.sh - Safe Git sync tool
# Usage: ./git-sync.sh [branch]

set -e

BRANCH=${1:-development}

echo "🔍 Switching to branch: $BRANCH"
git checkout "$BRANCH"

echo "📥 Fetching latest from origin..."
git fetch origin

echo "⚡ Your branch vs remote status:"
git status -sb

echo
echo "How would you like to sync?"
echo "1) Merge remote changes into local branch (safe, default)"
echo "2) Rebase local commits on top of remote (cleaner history)"
read -p "Choose [1/2]: " choice

if [[ "$choice" == "2" ]]; then
    echo "🔄 Rebasing $BRANCH onto origin/$BRANCH..."
    git pull --rebase origin "$BRANCH"
else
    echo "🔄 Merging origin/$BRANCH into $BRANCH..."
    git pull origin "$BRANCH"
fi

echo "🚀 Pushing branch $BRANCH to origin..."
git push origin "$BRANCH"

echo "✅ Sync complete!"

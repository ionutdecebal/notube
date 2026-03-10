#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

PATTERN='(sk-(proj-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,})'

if git grep -nE "$PATTERN" -- . >/tmp/notube-secret-scan.txt; then
  echo "Potential secret detected in tracked files:"
  cat /tmp/notube-secret-scan.txt
  exit 1
fi

echo "No key-like secrets found in tracked files."

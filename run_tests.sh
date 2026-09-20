#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "======================================================================"
echo "Running All 50 Automated Pytest Tests..."
echo "======================================================================"
pytest tests/ -v

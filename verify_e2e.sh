#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "======================================================================"
echo "Running AGRIOS 6-Step Judge Walkthrough Verification..."
echo "======================================================================"
python3 scripts/verify_complete_e2e_walkthrough.py

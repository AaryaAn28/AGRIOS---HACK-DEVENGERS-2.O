#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "======================================================================"
echo "Starting AGRIOS Server on http://0.0.0.0:${PORT:-8000} ..."
echo "======================================================================"
python3 run.py

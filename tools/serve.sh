#!/usr/bin/env bash
# Sert le site sous /nouste-corrida-trail/ comme GitHub Pages : http://localhost:8765/nouste-corrida-trail/
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; ln -s "$ROOT" "$TMP/nouste-corrida-trail"
cd "$TMP" && exec python3 -m http.server "${1:-8765}"

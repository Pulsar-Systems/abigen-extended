#!/bin/sh
set -e
rm -rf dist
tsc
chmod +x dist/index.js
cp package.json dist/package.json
cp README.md dist/README.md

#!/bin/bash
set -euo pipefail
npm install
# Pre-publish safety net: auto-convert any stray em-dashes to hyphens so the
# verify:no-em-dash build guard (run by `npm run build`'s prebuild) never fails.
npx tsx scripts/fix-em-dash.ts
npm run build
# Next's standalone trace does not copy static or public, and on Replit the
# nested `.next/standalone/.next` directory is not always present when this
# copy runs. Create it first so a clean postbuild is not followed by a
# failing `cp` (that was the non-zero deploy after "no matches").
mkdir -p .next/standalone/.next/static .next/standalone/public
cp -a .next/static/. .next/standalone/.next/static/
cp -a public/. .next/standalone/public/

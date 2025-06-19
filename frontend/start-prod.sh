#!/bin/bash
cd "$(dirname "$0")"
../node_modules/.bin/next build
exec ../node_modules/.bin/next start -p 3000 
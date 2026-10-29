#!/bin/sh
# Publica Cuernos en GitHub Pages: compila y sube dist/ a la rama gh-pages (Pages la sirve tal cual).
# Se usa en vez de una Action porque la conexión de gh de este PC no tiene permiso para subir workflows.
set -e
cd "$(dirname "$0")/.."
npm test
npm run build:pages
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" commit -q -m "Publicar $(date +%F\ %H:%M)"
git push -q -f https://github.com/adambursey7-sudo/cuernos.git gh-pages
rm -rf .git
echo "Publicado: https://adambursey7-sudo.github.io/cuernos/"

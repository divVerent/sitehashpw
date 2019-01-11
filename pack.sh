#!/bin/sh

set -ex

sh LICENSE > LICENSE.html

for size in 16 24 32 48 128; do
	inkscape -z -e icon-"$size".png -w "$size" -h "$size" icon.svg
done

sh <<EEOF > manifest.json
cat <<EOF
`cat manifest.in.json`
EOF
EEOF

rm -f extension.zip
zip -9r extension.zip \
	manifest.json \
	argon2-browser/dist/argon2-asm.min.js \
	icon-*.png \
	sitehashpw.js \
	sitehashpw-extension* \
	sitehashpw-frontend.css \
	LICENSE \
	LICENSE.html \
	argon2-browser/argon2/LICENSE \
	argon2-browser/README.md \
	crypto-js/LICENSE \
	crypto-js/README.md \
	$(tr '"' '\n' < manifest.json | grep -E '/.*\.(js|html|png)$')

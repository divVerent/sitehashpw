#!/bin/sh

set -ex
sh LICENSE > LICENSE.html
sh <<EEOF > manifest.json
cat <<EOF
`cat manifest.in.json`
EOF
EEOF
rm -f extension.zip
zip -9r extension.zip \
	manifest.json \
	argon2-browser/dist/argon2-asm.min.js \
	sitepw.js \
	sitepw-extension* \
	sitepw-frontend.css \
	LICENSE \
	LICENSE.html \
	argon2-browser/argon2/LICENSE \
	argon2-browser/README.md \
	crypto-js/LICENSE \
	crypto-js/README.md \
	$(tr '"' '\n' < manifest.json | grep -E '/.*\.(js|html|png)$')

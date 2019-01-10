#!/bin/sh

sh LICENSE > LICENSE.html
zip -9r extension.zip \
	manifest.json \
	argon2-browser/dist/argon2-asm.min.js \
	*.js \
	*.css \
	*.html \
	LICENSE \
	LICENSE.html \
	argon2-browser/argon2/LICENSE \
	argon2-browser/README.md \
	crypto-js/LICENSE \
	crypto-js/README.md \
	$(tr '"' '\n' < manifest.json | grep -E '/.*\.(js|html|png)$')

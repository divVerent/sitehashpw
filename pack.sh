#!/bin/sh

set -ex

sh LICENSE > LICENSE.html

for size in 16 24 32 48 128; do
	inkscape -z -o icon-"$size".png -w "$size" -h "$size" icon.svg
done

sh <<EEOF > manifest.json
cat <<EOF
`cat manifest.in.json`
EOF
EEOF

sed -e "
	1 i publicSuffixListRaw = '\\\\
	s,\\\\,\\\\\\\\,g
	s,',\\\\',g
	s,$,\\\\n\\\\,
	\$ a ';
" < list/public_suffix_list.dat > public-suffix-list-raw.js

rm -f extension.zip
zip -9r extension.zip \
	manifest.json \
	argon2-browser/dist/argon2-asm.min.js \
	icon-*.png \
	module-defs.js \
	sitehashpw.js \
	sitehashpw-extension* \
	sitehashpw-frontend.css \
	LICENSE \
	LICENSE.html \
	argon2-browser/argon2/LICENSE \
	argon2-browser/README.md \
	crypto-js/LICENSE \
	crypto-js/README.md \
	punycode.js/punycode.js \
	punycode.js/LICENSE-MIT.txt \
	publicsuffixlist.js/APLv2 \
	publicsuffixlist.js/GPLv3 \
	publicsuffixlist.js/publicsuffixlist.js \
	public-suffix-list-raw.js \
	list/LICENSE \
	$(tr '"' '\n' < manifest.in.json | grep -E '/.*\.(js|html|png)$')

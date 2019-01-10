/**
 * @fileoverview Description of this file.
 */
const ARGON2_PEPPER = "3.243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C";  // Pi in hex.
const methods = {
	"HMAC-SHA-1": { func: (site, masterpw, generation, len) => { return Promise.resolve(CryptoJS.HmacSHA1(site + "\n", masterpw + "#" + generation).toString(CryptoJS.enc.Base64)); }, command: "echo \"$site\" | openssl sha1 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
	"HMAC-SHA-256": { func: (site, masterpw, generation, len) => { return Promise.resolve(CryptoJS.HmacSHA256(site + "\n", masterpw + "#" + generation).toString(CryptoJS.enc.Base64)); }, command: "echo \"$site\" | openssl sha256 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
	"HMAC-SHA-512": { func: (site, masterpw, generation, len) => { return Promise.resolve(CryptoJS.HmacSHA512(site + "\n", masterpw + "#" + generation).toString(CryptoJS.enc.Base64)); }, command: "echo \"$site\" | openssl sha512 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
	"HMAC-SHA-3": { func: (site, masterpw, generation, len) => { return Promise.resolve(CryptoJS.HmacSHA3(site + "\n", masterpw + "#" + generation).toString(CryptoJS.enc.Base64)); }, command: "echo \"$site\" | openssl sha3 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
	"HMAC-RIPEMD-160": { func: (site, masterpw, generation, len) => { return Promise.resolve(CryptoJS.HmacRIPEMD160(site + "\n", masterpw + "#" + generation).toString(CryptoJS.enc.Base64)); }, command: "echo \"$site\" | openssl rmd160 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
	"Argon2id-1Mx16": { func: (site, masterpw, generation, len) => { return argon2.hash({distPath: 'argon2-browser/dist', pass: masterpw, salt: site + "#" + generation + "#" + ARGON2_PEPPER, time: 16, mem: 1024, hashLen: Math.floor((len*1+1) * 3 / 4), parallelism: 1, type: argon2.ArgonType.Argon2id}).then((hash) => { return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(hash.hashHex)); }); }, command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" + ARGON2_PEPPER + "\" -id -r -t 16 -m 10 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | openssl base64 -e | cut -c 1-$len" },
	"Argon2id-4Mx3": { func: (site, masterpw, generation, len) => { return argon2.hash({distPath: 'argon2-browser/dist', pass: masterpw, salt: site + "#" + generation + "#" + ARGON2_PEPPER, time: 3, mem: 4096, hashLen: Math.floor((len*1+1) * 3 / 4), parallelism: 1, type: argon2.ArgonType.Argon2id}).then((hash) => { return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(hash.hashHex)); }); }, command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" + ARGON2_PEPPER + "\" -id -r -t 3 -m 12 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | openssl base64 -e | cut -c 1-$len" },
	"Argon2id-16Mx1": { func: (site, masterpw, generation, len) => { return argon2.hash({distPath: 'argon2-browser/dist', pass: masterpw, salt: site + "#" + generation + "#" + ARGON2_PEPPER, time: 1, mem: 16384, hashLen: Math.floor((len*1+1) * 3 / 4), parallelism: 1, type: argon2.ArgonType.Argon2id}).then((hash) => { return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(hash.hashHex)); }); }, command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" + ARGON2_PEPPER + "\" -id -r -t 1 -m 14 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | openssl base64 -e | cut -c 1-$len" },
};

function getsitename(site) {
	// TODO(rpolzer) .co.uk etc. handling
	site = site.toLowerCase();
	if (site.indexOf("/") >= 0) {
		const parser = document.createElement('a');
		parser.href = site;
		if (parser.hostname)
			site = parser.hostname;
	}
	const pattern = /[^.]*\.[^.]*$/;
	const match = pattern.exec(site);
	if (match)
		site = match[0];
	return site;
}

function sitepw(site, generation, func, len, masterpw) {
	return func(site, masterpw, generation, len).then((raw) => {
		return raw.substr(0, len);
	});
}

/**
 * @fileoverview Description of this file.
 */

// Pi in hex, until this line hits 80 chars.
const ARGON2_PEPPER = "3.243F6A8885A308D313198A2E03707344A4093822299F31D0082EF";

function hmac_func(func) {
  return (site, masterpw, generation, len) =>
    Promise.resolve(func(site + "\n", masterpw + "#" + generation).toString(
      CryptoJS.enc.Base64));
}

function argon2i_func(time, memp) {
  return (site, masterpw, generation, len) => argon2.hash({
      distPath: 'argon2-browser/dist',
      pass: masterpw,
      salt: site + "#" + generation + "#" + ARGON2_PEPPER,
      time: time,
      mem: Math.pow(2, memp),
      hashLen: Math.floor((len * 1 + 1) * 3 / 4),
      parallelism: 1,
      type: argon2.ArgonType.Argon2id
    })
    .then((hash) => CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Hex.parse(hash.hashHex)));
}

const methods = {
  "HMAC-SHA-256": {
    func: hmac_func(CryptoJS.HmacSHA256),
    command: "echo \"$site\" | openssl sha256 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len"
  },
  "Argon2id-1Mx16": {
    func: argon2i_func(16, 10),
    command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" +
      ARGON2_PEPPER +
      "\" -id -r -t 16 -m 10 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | openssl base64 -e | cut -c 1-$len"
  },
  "Argon2id-4Mx3": {
    func: argon2i_func(3, 12),
    command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" +
      ARGON2_PEPPER +
      "\" -id -r -t 3 -m 12 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | openssl base64 -e | cut -c 1-$len"
  },
  "Argon2id-16Mx1": {
    func: argon2i_func(1, 14),
    command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" +
      ARGON2_PEPPER +
      "\" -id -r -t 1 -m 14 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | openssl base64 -e | cut -c 1-$len"
  },
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

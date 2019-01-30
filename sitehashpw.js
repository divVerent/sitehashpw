/**
 * @fileoverview Description of this file.
 */

// The first 100 digits beyind the comma of i^i = exp(-pi/2) = e(-2*a(1)) in bc.
const ARGON2_PEPPER = "0." +
  // 345678901234567890123456789012345678901234567890
  "20787957635076190854695561983497877003387784163176" +
  "96080751358830554198772854821397886002778654260353";

function hmac_func(func) {
  return (site, masterpw, generation, len) =>
    Promise.resolve(func(site + "\n", masterpw + "#" + generation).toString(
      CryptoJS.enc.Base64));
}

function pbkdf2_func(func, iterations) {
  return (site, masterpw, generation, len) =>
    Promise.resolve(
      CryptoJS.PBKDF2(masterpw, site + "#" + generation, {
        keySize: Math.floor((len * 1 + 3) / 4),
        hasher: func,
        iterations: iterations
      }).toString(
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
    command: "echo \"$site\" | openssl sha256 -hmac \"$masterpw#$generation\" -binary | base64 | cut -c 1-$len"
  },
  "PBKDF2-SHA-256-10k": {
    func: pbkdf2_func(CryptoJS.algo.SHA256, 10000),
    command: "echo -n \"$masterpw\" | nettle-pbkdf2 --iterations=10000 --length=$(((len+1)*3/4)) --raw \"$site#$generation\" | base64 | cut -c 1-$len"
  },
  "Argon2id-1Mx16": {
    func: argon2i_func(16, 10),
    command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" +
      ARGON2_PEPPER +
      "\" -id -r -t 16 -m 10 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | base64 | cut -c 1-$len"
  },
  "Argon2id-4Mx3": {
    func: argon2i_func(3, 12),
    command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" +
      ARGON2_PEPPER +
      "\" -id -r -t 3 -m 12 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | base64 | cut -c 1-$len"
  },
  "Argon2id-16Mx1": {
    func: argon2i_func(1, 14),
    command: "echo -n \"$masterpwd\" | argon2 \"$site#$generation#" +
      ARGON2_PEPPER +
      "\" -id -r -t 1 -m 14 -p 1 -l $(((len+1)*3/4)) | xxd -r -p | base64 | cut -c 1-$len"
  },
};

function getsitename(site) {
  let protocolPrefix = '';
  site = site.toLowerCase();
  if (site.indexOf("/") >= 0) {
    const parser = document.createElement('a');
    parser.href = site;
    if (parser.hostname) {
      site = parser.hostname;
      if (parser.protocol != 'https:')
        protocolPrefix = parser.protocol + '//';
    }
  }
  // For known domains, 
  const domain = window.publicSuffixList.getDomain(site);
  // Ensure at least two labels.
  if (domain.match(/\./)) {
    return protocolPrefix + domain;
  }
  // Fallback to "last two labels".
  const match = site.match(/[^.]*\.[^.]*$/);
  if (match)
    site = match[0];
  return protocolPrefix + site;
}

function sitehashpw(site, generation, func, len, masterpw) {
  return func(site, masterpw, generation, len).then((raw) => {
    return raw.substr(0, len);
  });
}

function generate_antiphish() {
  let antiphish = "";
  for (let i = 0; i < 9; ++i) {
    const template = (i % 2 == 0) ? "bcdfghjklmnpqrstvwxyz" : "aeiou";
    antiphish += template[Math.floor(Math.random() * template.length)];
  }
  return antiphish;
}

window.publicSuffixList.parse(publicSuffixListRaw, punycode.toASCII);

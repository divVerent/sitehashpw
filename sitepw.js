/**
 * @fileoverview Description of this file.
 */
var methods = {
  "MD5": { func: function(site, masterpw, generation) { return CryptoJS.MD5(site + "#" + masterpw + "#" + generation + "#" + site + "#" + masterpw + "#" + generation + "#" + site + "\n"); }, command: "echo \"$site#$masterpw#$generation#$site#$masterpw#$generation#$site\" | openssl md5 -binary | openssl base64 -e | cut -c 1-$len" },
  "SHA-1": { func: function(site, masterpw, generation) { return CryptoJS.SHA1(site + "#" + masterpw + "#" + generation + "#" + site + "#" + masterpw + "#" + generation + "#" + site + "\n"); }, command: "echo \"$site#$masterpw#$generation#$site#$masterpw#$generation#$site\" | openssl sha1 -binary | openssl base64 -e | cut -c 1-$len" },
  "SHA-256": { func: function(site, masterpw, generation) { return CryptoJS.SHA256(site + "#" + masterpw + "#" + generation + "#" + site + "#" + masterpw + "#" + generation + "#" + site + "\n"); }, command: "echo \"$site#$masterpw#$generation#$site#$masterpw#$generation#$site\" | openssl sha256 -binary | openssl base64 -e | cut -c 1-$len" },
  "SHA-512": { func: function(site, masterpw, generation) { return CryptoJS.SHA512(site + "#" + masterpw + "#" + generation + "#" + site + "#" + masterpw + "#" + generation + "#" + site + "\n"); }, command: "echo \"$site#$masterpw#$generation#$site#$masterpw#$generation#$site\" | openssl sha512 -binary | openssl base64 -e | cut -c 1-$len" },
  "SHA-3": { func: function(site, masterpw, generation) { return CryptoJS.SHA3(site + "#" + masterpw + "#" + generation + "#" + site + "#" + masterpw + "#" + generation + "#" + site + "\n"); }, command: "echo \"$site#$masterpw#$generation#$site#$masterpw#$generation#$site\" | openssl sha3 -binary | openssl base64 -e | cut -c 1-$len" },
  "RIPEMD-160": { func: function(site, masterpw, generation) { return CryptoJS.RIPEMD160(site + "#" + masterpw + "#" + generation + "#" + site + "#" + masterpw + "#" + generation + "#" + site + "\n"); }, command: "echo \"$site#$masterpw#$generation#$site#$masterpw#$generation#$site\" | openssl rmd160 -binary | openssl base64 -e | cut -c 1-$len" },
  "HMAC-MD5": { func: function(site, masterpw, generation) { return CryptoJS.HmacMD5(site + "\n", masterpw + "#" + generation); }, command: "echo \"$site\" | openssl md5 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
  "HMAC-SHA-1": { func: function(site, masterpw, generation) { return CryptoJS.HmacSHA1(site + "\n", masterpw + "#" + generation); }, command: "echo \"$site\" | openssl sha1 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
  "HMAC-SHA-256": { func: function(site, masterpw, generation) { return CryptoJS.HmacSHA256(site + "\n", masterpw + "#" + generation); }, command: "echo \"$site\" | openssl sha256 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
  "HMAC-SHA-512": { func: function(site, masterpw, generation) { return CryptoJS.HmacSHA512(site + "\n", masterpw + "#" + generation); }, command: "echo \"$site\" | openssl sha512 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
  "HMAC-SHA-3": { func: function(site, masterpw, generation) { return CryptoJS.HmacSHA3(site + "\n", masterpw + "#" + generation); }, command: "echo \"$site\" | openssl sha3 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
  "HMAC-RIPEMD-160": { func: function(site, masterpw, generation) { return CryptoJS.HmacRIPEMD160(site + "\n", masterpw + "#" + generation); }, command: "echo \"$site\" | openssl rmd160 -hmac \"$masterpw#$generation\" -binary | openssl base64 -e | cut -c 1-$len" },
};

function getsitename(site) {
  site = site.toLowerCase();
  if (site.indexOf("/") >= 0) {
    var parser = document.createElement('a');
    parser.href = site;
    if (parser.hostname)
      site = parser.hostname;
  }
  var pattern = /[^.]*\.[^.]*$/;
  var match = pattern.exec(site);
  if (match)
    site = match[0];
  return site;
}

function sitepw(site, generation, func, len, masterpw) {
  return func(site, masterpw, generation).toString(CryptoJS.enc.Base64).substr(0, len);
}

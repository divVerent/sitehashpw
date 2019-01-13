const settings_sync = {
  "method": "Argon2id-16Mx1",
  "len": 12,
  "overrides": {},
  "generation": 1
};
const settings_local = {
  "masterpw": "",
  "oldmasterpw": ""
};

// Note: the background script has to be persistent for these settings
// to survive across multiple invocations. Very useful for the case of not
// storing the master password on disk.
const settings_nosave = {
  "last_site": "",
};

function get_setting(s) {
  if (s in settings_sync) {
    return settings_sync[s];
  }
  if (s in settings_local) {
    return settings_local[s];
  }
  if (s in settings_nosave) {
    return settings_nosave[s];
  }
  alert("invalid use of get_setting: " + s);
}

function set_setting(s, v) {
  if (s in settings_sync) {
    settings_sync[s] = v;
    return;
  }
  if (s in settings_local) {
    settings_local[s] = v;
    return;
  }
  if (s in settings_nosave) {
    settings_nosave[s] = v;
    return;
  }
  alert("invalid use of set_setting: " + s);
}

function update_settings(e) {
  for (const [key, value] of Object.entries(e))
    set_setting(key, value);
  if ("overrides" in e)
    set_setting("overrides", fix_overrides(get_setting("overrides")));
}

function save_settings() {
  chrome.storage.local.set(settings_local);
  chrome.storage.sync.set(settings_sync);
}

function get_default_settings(sitename) {
  return {
    "method": get_setting("method"),
    "len": get_setting("len"),
    "generation": get_setting("generation"),
    "use_old_password": false,
    "alias": sitename
  };
}

function fix_override(sitename, override) {
  const site_settings = get_default_settings(sitename);
  if (override == null) {
    override = {};
  }
  for (const k of Object.keys(site_settings)) {
    if (k in override) {
      site_settings[k] = override[k];
    }
  }
  return site_settings;
}

function get_site_settings(sitename) {
  let site_settings = get_setting("overrides")[sitename];
  if (site_settings == null) {
    site_settings = get_default_settings(sitename);
    get_setting("overrides")[sitename] = site_settings;
  }
  return site_settings;
}

function fix_overrides(v) {
  const out = {};
  for (const [k, override] of Object.entries(v)) {
    out[k] = fix_override(k, override)
  }
  return out;
}

function get_sitehashpw(url) {
  const sitename = getsitename(url);
  set_setting("last_site", sitename);
  const site_settings = get_site_settings(sitename);
  const method = methods[site_settings.method];
  const pw_key = site_settings.use_old_password ? "oldmasterpw" : "masterpw";
  const pw_string = site_settings.use_old_password ? "OLD" : "CURRENT";

  let pw = get_setting(pw_key);
  if (pw == "") {
    const new_pw = prompt(pw_string + " master password:");
    if (new_pw != null) {
      pw = new_pw;
    }
  }

  return sitehashpw(site_settings.alias, site_settings.generation, method.func,
    site_settings.len, pw);
}

let q = Promise.resolve();

function do_sitehashpw(tab) {
  q = q.finally(() => {
    return get_sitehashpw(tab.url, true).then((password) => {
      chrome.tabs.executeScript(tab.id, {
        "file": "sitehashpw-extension-contentscript.js"
      }, (fieldnames) => {
        if (fieldnames == null) {
          alert(
            'Failed to insert password: content script has not run.'
          );
          return;
        }
        const message = {};
        for (const fieldname of fieldnames)
          message[fieldname] = password;
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (!response.sitehashpw_status) {
            alert(
              'Failed to insert password: content script failed.'
            );
          }
        });
      });
    });
  });
}

function init() {
  chrome.storage.sync.get(["method", "len", "overrides", "generation"], (
    new_settings) => {
    update_settings(new_settings);
    chrome.storage.local.get(["masterpw"], (new_settings) => {
      update_settings(new_settings);
      chrome.browserAction.onClicked.addListener(do_sitehashpw);
      chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
          if (request.sitehashpw_get_settings != null) {
            const out = {};
            for (const setting of request.sitehashpw_get_settings) {
              out[setting] = get_setting(setting);
            }
            sendResponse(out);
          }
          if (request.sitehashpw_get_password != null) {
            get_sitehashpw(request.sitehashpw_get_password).then(
              sendResponse);
            return true; // We'll sendResponse asynchronously.
          }
          if (request.sitehashpw_update_settings != null) {
            update_settings(request.sitehashpw_update_settings);
            save_settings();
            sendResponse(null);
          }
        }
      );
    });
  });
}

init();

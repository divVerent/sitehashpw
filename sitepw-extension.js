const settings_sync = {
  "method": "HMAC-SHA-256",
  "len": 12,
  "overrides": {},
  "generation": 1
};
const settings_local = {
  "masterpw": "",
  "oldmasterpw": ""
};
const settings_nosave = {
  "last_site": "",
  "masterpw_temp": "",
  "oldmasterpw_temp": ""
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
  for (let key in e)
    set_setting(key, e[key]);
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
  let need_write = false;
  if (override == null) {
    override = {};
    need_write = true;
  }
  for (let k in site_settings) {
    if (override[k] == null) {
      need_write = true;
    } else {
      site_settings[k] = override[k];
    }
  }
  if (need_write)
    return site_settings;
  else
    return null;
}

function get_site_settings(sitename, allow_write) {
  let site_settings = get_setting("overrides")[sitename];
  if (site_settings == null) {
    site_settings = = get_default_settings(sitename);
    if (allow_write) {
      get_setting("overrides")[sitename] = site_settings;
    }
  }
  return site_settings;
}

function fix_overrides(v) {
  const out = {};
  for (let k in v) {
    const override = v[k];
    const site_settings = fix_override(k, override);
    if (site_settings == null)
      out[k] = override;
    else
      out[k] = site_settings;
  }
  return out;
}

function get_sitepw(url, allow_write) {
  const sitename = getsitename(url);
  set_setting("last_site", sitename);
  const site_settings = get_site_settings(sitename, allow_write);
  const method = methods[site_settings.method];
  const pw_key = site_settings.use_old_password ? "oldmasterpw" : "masterpw";
  const pw_tempkey = site_settings.use_old_password ? "oldmasterpw_temp" :
    "masterpw_temp";
  const pw_string = site_settings.use_old_password ? "OLD" : "CURRENT";

  let pw = get_setting(pw_key);
  if (pw == "")
    pw = get_setting(pw_tempkey);
  if (pw == "") {
    const new_pw = prompt(pw_string + " master password:");
    if (new_pw != null && new_pw != "") {
      pw = new_pw;
      if (allow_write)
        set_setting(pw_tempkey, new_pw);
    }
  }

  return sitepw(site_settings.alias, site_settings.generation, method.func,
    site_settings.len, pw);
}

let q = Promise.resolve();

function do_sitepw(tab) {
  q = q.finally(() => {
    return get_sitepw(tab.url, true).then((password) => {
      chrome.tabs.executeScript(tab.id, {
        "file": "sitepw-extension-contentscript.js"
      }, (fieldnames) => {
        const message = {};
        for (i = 0; i < fieldnames.length; ++i)
          message[fieldnames[i]] = password;
        chrome.tabs.sendMessage(tab.id, message);
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
      chrome.browserAction.onClicked.addListener(do_sitepw);
      chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
          if (request.sitepw_get_settings != null) {
            const out = {};
            for (let i = 0; i < request.sitepw_get_settings.length; ++
              i) {
              out[request.sitepw_get_settings[i]] = get_setting(
                request.sitepw_get_settings[i]);
            }
            sendResponse(out);
          }
          if (request.sitepw_get_password != null) {
            get_sitepw(request.sitepw_get_password, false).then(
              sendResponse);
            return true; // We'll sendResponse asynchronously.
          }
          if (request.sitepw_update_settings != null) {
            update_settings(request.sitepw_update_settings);
            save_settings();
            sendResponse(null);
          }
        }
      );
    });
  });
}

init();

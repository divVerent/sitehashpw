const settings_sync = {
  "antiphish": generate_antiphish(),
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

function get_setting (tab, s) {
  if (s in settings_sync) {
    return settings_sync[s];
  }
  if (s in settings_local) {
    return settings_local[s];
  }
  if (s in settings_nosave) {
    return settings_nosave[s];
  }
  do_alert(tab, "invalid use of get_setting: " + s);
}

function set_setting (tab, s, v) {
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
  do_alert(tab, "invalid use of set_setting: " + s);
}

function update_settings (tab, e) {
  for (const [key, value] of Object.entries(e))
    set_setting(tab, key, value);
  if ("overrides" in e)
    set_setting(tab, "overrides", fix_overrides(tab, get_setting(tab, "overrides")));
}

function save_settings () {
  browser.storage.local.set(settings_local);
  browser.storage.sync.set(settings_sync);
}

function get_default_settings (tab, sitename) {
  return {
    "method": get_setting(tab, "method"),
    "len": get_setting(tab, "len"),
    "generation": get_setting(tab, "generation"),
    "use_old_password": false,
    "alias": sitename
  };
}

function fix_override (tab, sitename, override) {
  const site_settings = get_default_settings(tab, sitename);
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

function get_site_settings (tab, sitename) {
  let site_settings = get_setting(tab, "overrides")[sitename];
  if (site_settings == null) {
    site_settings = get_default_settings(tab, sitename);
    get_setting(tab, "overrides")[sitename] = site_settings;
    save_settings();
  }
  return site_settings;
}

function fix_overrides (tab, v) {
  const out = {};
  for (const [k, override] of Object.entries(v)) {
    out[k] = fix_override(tab, k, override)
  }
  return out;
}

async function get_sitehashpw (tab, url) {
  const sitename = getsitename(url);
  set_setting(tab, "last_site", sitename);
  const site_settings = get_site_settings(tab, sitename);
  const method = methods[site_settings.method];
  const pw_key = site_settings.use_old_password ? "oldmasterpw" : "masterpw";
  const pw_string = site_settings.use_old_password ? "OLD" : "CURRENT";

  let pw = get_setting(tab, pw_key);
  if (pw == "") {
    const new_pw = await do_prompt(tab, 'Your AntiPhish is: ' + get_setting(tab, 'antiphish') +
      '. Do not enter your master password here if this does not match what ' +
      'the extension options show, or if the AntiPhish message is missing ' +
      'entirely.\n\n' +
      pw_string + ' master password:');
    if (new_pw != null) {
      pw = new_pw;
    }
  }

  return await sitehashpw(site_settings.alias, site_settings.generation, method.func,
    site_settings.len, pw);
}

let q = Promise.resolve();

async function do_alert (tab, message) {
  if (tab == null) {
    console.error(message);
    return;
  }
  await browser.tabs.executeScript(tab.id, {
    "file": "webextension-polyfill/dist/browser-polyfill.js"
  });
  await browser.tabs.executeScript(tab.id, {
    "file": "sitehashpw-extension-contentscript.js"
  });
  await browser.tabs.sendMessage(tab.id, {
    'sitehashpw_alert': message
  });
}

async function do_prompt (tab, message) {
  if (tab == null) {
    console.error(message);
    return null;
  }
  await browser.tabs.executeScript(tab.id, {
    "file": "webextension-polyfill/dist/browser-polyfill.js"
  });
  await browser.tabs.executeScript(tab.id, {
    "file": "sitehashpw-extension-contentscript.js"
  });
  const response = await browser.tabs.sendMessage(tab.id, {
    'sitehashpw_prompt': message
  });
  return response;
}

function do_sitehashpw (tab) {
  q = q.finally(async () => {
    const password = await get_sitehashpw(tab, tab.url, true);
    await browser.tabs.executeScript(tab.id, {
      "file": "webextension-polyfill/dist/browser-polyfill.js"
    });
    const fieldnames = await browser.tabs.executeScript(tab.id, {
      "file": "sitehashpw-extension-contentscript.js"
    });
    if (fieldnames == null) {
      await do_alert(
        tab, 'Failed to insert password: content script has not run.'
      );
      return;
    }
    await browser.tabs.sendMessage(tab.id, {
      'sitehashpw_password': password
    });
  });
}

async function init () {
  const new_sync_settings = await browser.storage.sync.get(Object.keys(settings_sync));
  update_settings(null, new_sync_settings);
  const new_local_settings = await browser.storage.local.get(Object.keys(settings_local));
  update_settings(null, new_local_settings);
  save_settings(); // Make sure settings always persist.
  browser.browserAction.onClicked.addListener(do_sitehashpw);
  browser.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      if (request.sitehashpw_get_settings != null) {
        const out = {};
        for (const setting of request.sitehashpw_get_settings) {
          out[setting] = get_setting(null, setting);
        }
        sendResponse(out);
      }
      if (request.sitehashpw_get_password != null) {
        get_sitehashpw(null, request.sitehashpw_get_password).then(
          sendResponse);
        return true; // We'll sendResponse asynchronously.
      }
      if (request.sitehashpw_update_settings != null) {
        update_settings(null, request.sitehashpw_update_settings);
        save_settings();
        sendResponse(null);
      }
    }
  );
}

init();
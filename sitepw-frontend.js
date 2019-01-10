/**
 * @fileoverview Description of this file.
 */

let masterpw, site, generation, pw, method, len, showcommandlink;
let q = Promise.resolve();

function do_sitepw() {
  q = q.finally(() => {
    const sitename = getsitename(site.value);
    const method_name = method.options[method.selectedIndex].value;
    return sitepw(sitename, generation.value, methods[method_name].func,
      len.value, masterpw.value).then((password) => {
      pw.value = password;
      if (document.activeElement == pw)
        pw.select();
    });
  });
}

let timed_sitepw_timer;

function timed_sitepw() {
  if (timed_sitepw_timer != null)
    clearTimeout(timed_sitepw_timer);
  localStorage.setItem("len", len.value);
  localStorage.setItem("method", method.options[method.selectedIndex].value);
  if (this == generation) {
    const sitename = getsitename(site.value);
    if (generation.value == "1")
      localStorage.removeItem("generation." + sitename);
    else
      localStorage.setItem("generation." + sitename, generation.value);
  }
  if (this == site) {
    const sitename = getsitename(site.value);
    const generation_new = localStorage.getItem(
      "generation." + sitename);
    if (generation_new == null || generation_new == "")
      generation.value = "1";
    else
      generation.value = generation_new;
  }
  timed_sitepw_timer = setTimeout(do_sitepw, 300);
  return true;
}

function select_this() {
  this.select();
  return true;
}

function register_input_events(box) {
  if (box.type == "password" || box.type == "text")
    box.onclick = select_this;
  box.onchange = timed_sitepw;
  box.onkeyup = timed_sitepw;
  box.onkeydown = timed_sitepw;
  box.onblur = timed_sitepw;
}

function init() {
  // Get objects.
  masterpw = document.getElementById("masterpw");
  site = document.getElementById("site");
  generation = document.getElementById("generation");
  pw = document.getElementById("pw");
  method = document.getElementById("method");
  len = document.getElementById("len");
  showcommandlink = document.getElementById("showcommandlink");

  document.getElementById("bookmarklet").href =
    "javascript:void(window.open(\"" +
    location.href + "#\"+location.href));";

  // Load stuff.
  if (localStorage.getItem("len") != "")
    len.value = localStorage.getItem("len");
  if (localStorage.getItem("method") != "")
    for (let i = 0; i < method.options.length; ++i)
      if (method.options[i].value ==
        localStorage.getItem("method"))
        method.selectedIndex = i;

      // Fill in queried URL.
  if (location.hash.length > 1)
    site.value = location.hash.substr(1);
  else if (document.referrer != "")
    site.value = document.referrer;
  do_sitepw(site.form);

  // Ask for master password.
  if (masterpw.value == "")
    masterpw.focus();

  // Now register event handlers.
  register_input_events(masterpw);
  register_input_events(site);
  register_input_events(generation);
  register_input_events(pw);
  register_input_events(len);
  register_input_events(method);
  showcommandlink.onclick = show_command;
}

function show_command() {
  console.log(methods[method.options[method.selectedIndex].value].command);
  alert(methods[method.options[method.selectedIndex].value].command);
}

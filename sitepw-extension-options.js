var masterpw, oldmasterpw, generation, method, len, overrides, overrides_add, overrides_delete, overrides_edit, overrides_password, overrides_mark_as_old, overrides_mark_as_current;
var settings = {};

function serialize(sitename, override, force) {
	var text = "";
	if (override.alias != sitename || force)
		text += " alias=" + override.alias;
	if (override.generation != settings.generation || force)
		text += " generation=" + override.generation;
	if (override.len != settings.len || force)
		text += " len=" + override.len;
	if (override.method != settings.method || force)
		text += " method=" + override.method;
	if (override.use_old_password)
		text += " use_old_password";
	if (text == "")
		return "no overrides";
	else
		return text.substr(1);
}

function parse(sitename, override_str) {
	var obj = {"len": settings.len, "method": settings.method, "generation": settings.generation, "alias": sitename, "use_old_password": false};
	var items = override_str.split(" ");
	for (var i = 0; i < items.length; ++i) {
		var item = items[i];
		if (item.substr(0, 4) == "len=")
			obj.len = item.substr(4);
		if (item.substr(0, 7) == "method=")
			obj.method = item.substr(7);  // FIXME(rpolzer) verify method
		if (item.substr(0, 11) == "generation=")
			obj.generation = item.substr(11);
		if (item.substr(0, 6) == "alias=")
			obj.alias = item.substr(6);
		if (item == "use_old_password")
			obj.use_old_password = true;
	}
	return obj;
}

function repopulate_overrides_list(selected) {
	if (selected == null)
		if (overrides.selectedIndex >= 0)
			selected = overrides.options[overrides.selectedIndex].value;
	overrides_list = [];
	for (var o in settings.overrides) {
		overrides_list.push(o);
	}
	overrides_list.sort();
	while (overrides.hasChildNodes())
		overrides.removeChild(overrides.lastChild);
	for (var i = 0; i < overrides_list.length; ++i) {
		var sitename = overrides_list[i];
		var override = settings.overrides[sitename];
		var opt = document.createElement("option");
		opt.value = sitename;
		var text = sitename + ": " + serialize(sitename, override, false);
		var txt = document.createTextNode(text);
		opt.appendChild(txt);
		if (selected == sitename)
			opt.selected = true;
		overrides.appendChild(opt);
	}
}

function save() {
	settings.masterpw = masterpw.value;
	settings.oldmasterpw = oldmasterpw.value;
	settings.generation = generation.value;
	settings.len = len.value;
	settings.method = method.options[method.selectedIndex].value;
	chrome.runtime.sendMessage({"sitepw_update_settings": settings}, function() {
		repopulate_overrides_list(null);
	});
	return true;
}
function select_this() {
	this.select();
	return true;
}
function register_input_events(box) {
	if (box.type == "password" || box.type == "text")
		box.onclick = select_this;
	box.onchange = save;
	box.onkeyup = save;
	box.onkeydown = save;
	box.onblur = save;
}
function add_override() {
	var sitename = prompt("Site name:");
	sitename = getsitename(sitename);
	settings.overrides[sitename] = {"len": settings.len, "method": settings.method, "generation": settings.generation, "alias": sitename};
	save();
	repopulate_overrides_list(sitename);
	edit_override();
}
function edit_override() {
	if (overrides.selectedIndex < 0)
		return;
	var sitename = overrides.options[overrides.selectedIndex].value;
	var str = serialize(sitename, settings.overrides[sitename], true);
	str = prompt("Overrides for " + sitename + ":", str);
	settings.overrides[sitename] = parse(sitename, str);
	save();
}
function show_override_password() {
	if (overrides.selectedIndex < 0)
		return;
	var sitename = overrides.options[overrides.selectedIndex].value;
	chrome.runtime.sendMessage({"sitepw_get_password": sitename}, function(pw) {
		alert(pw);
	});
}
function delete_override() {
	if (overrides.selectedIndex < 0)
		return;
	var sitename = overrides.options[overrides.selectedIndex].value;
	delete settings.overrides[sitename];
	save();
}
function mark_as_old() {
	for (var k in settings.overrides) {
		if (settings.overrides[k].use_old_password == true) {
			alert(k + " still uses the previous old password. Cannot proceed.");
			return;
		}
	}
	for (var k in settings.overrides)
		settings.overrides[k].use_old_password = true;
	save();
}
function mark_as_current() {
	for (var k in settings.overrides) {
		if (settings.overrides[k].use_old_password == false) {
			alert(k + " already uses the current password. Cannot proceed.");
			return;
		}
	}
	for (var k in settings.overrides)
		settings.overrides[k].use_old_password = false;
	save();
}

function init2(settings_) {
	settings = settings_;
	// Load stuff.
	masterpw.value = settings.masterpw;
	oldmasterpw.value = settings.oldmasterpw;
	generation.value = settings.generation;
	len.value = settings.len;
	if (settings.method != "")
		for (var i = 0; i < method.options.length; ++i)
			if (method.options[i].value == settings.method)
				method.selectedIndex = i;
	repopulate_overrides_list(settings.last_site);

	// Now register event handlers.
	register_input_events(masterpw);
	register_input_events(oldmasterpw);
	register_input_events(generation);
	register_input_events(len);
	register_input_events(method);
	overrides_add.onclick = add_override;
	overrides_edit.onclick = edit_override;
	overrides_password.onclick = show_override_password;
	overrides_delete.onclick = delete_override;
	overrides_mark_as_old.onclick = mark_as_old;
	overrides_mark_as_current.onclick = mark_as_current;
}
function init() {
	// Get objects.
	masterpw = document.getElementById("masterpw");
	oldmasterpw = document.getElementById("oldmasterpw");
	generation = document.getElementById("generation");
	method = document.getElementById("method");
	len = document.getElementById("len");
	overrides = document.getElementById("overrides");
	overrides_add = document.getElementById("overrides_add");
	overrides_edit = document.getElementById("overrides_edit");
	overrides_password = document.getElementById("overrides_password");
	overrides_delete = document.getElementById("overrides_delete");
	overrides_mark_as_old = document.getElementById("overrides_mark_as_old");
	overrides_mark_as_current = document.getElementById("overrides_mark_as_current");

	// Get settings.
	chrome.runtime.sendMessage({"sitepw_get_settings": ["masterpw", "oldmasterpw", "generation", "method", "len", "overrides", "last_site"]}, init2);
}

function show_command() {
	alert(methods[method.options[method.selectedIndex].value].command);
}

window.onload = init;

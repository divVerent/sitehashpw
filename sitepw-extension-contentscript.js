function is_viable(e) {
	if (e.nodeName == "INPUT") {
		if (e.type == "password")
			return true;
		if (e.type == "text")
			return true;
	}
	if (e.nodeName == "TEXTAREA") {
		return true;
	}
	return false;
}

function get_all_password_elements(e) {
	alert("Not yet implemented");
	return [];
}

function set_value(e, password) {
	e.value = password;
}

function set_password(password) {
	var elements = [document.activeElement];
	if (!is_viable(elements[0])) {
		elements = get_all_password_elements();
	}
	for (var i = 0; i < elements.length; ++i) {
		set_value(elements[i], password);
	}
	if (elements.length == 0)
		alert(password);
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.sitepw_password != null)
			set_password(request.sitepw_password);
	}
);

"sitepw_password";

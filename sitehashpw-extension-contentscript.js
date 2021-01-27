function is_viable (e) {
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

function set_value (e, password) {
  e.value = password;
}

function set_password (password) {
  const element = document.activeElement;
  if (!is_viable(element)) {
    return false;
  }
  set_value(element, password);
  return true;
}

browser.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.sitehashpw_password != null) {
      const status = set_password(request.sitehashpw_password);
      sendResponse({
        "sitehashpw_status": status
      });
      if (!status) {
        alert(
          'Failed to insert password: found no place to insert.'
        );
      }
    }
  }
);

// fieldnames =
"sitehashpw_password";
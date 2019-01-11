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

function set_value(e, password) {
  e.value = password;
}

function set_password(password) {
  const element = document.activeElement;
  if (!is_viable(element)) {
    return false;
  }
  set_value(element, password);
  return true;
}

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.sitehashpw_password != null)
      sendResponse({
        "sitehashpw_status": set_password(request.sitehashpw_password)
      });
  }
);

// fieldnames =
"sitehashpw_password";

'use strict';

//~ console.log('start');
var save = btnSave;
// Saves options to localStorage.
function saveOptions() {
    // Update status to let user know options were saved.
    save.innerHTML = chrome.i18n.getMessage("save_process");

    localStorage.showdownbar = checkbox_showdownbar.checked ? "true" : "false";

	save.innerHTML = chrome.i18n.getMessage("save_processed");
	setTimeout(function() {
		save.innerHTML = chrome.i18n.getMessage("save");
	}, 2000);
}

// Restores select box state to saved value from localStorage.
function restoreOptions() {
    checkbox_showdownbar.checked = localStorage.showdownbar == "true";
}


function setLocalization() {
  document.title  				         = chrome.i18n.getMessage("settingsHeader");
  settingsHeader.innerHTML 	    	 = chrome.i18n.getMessage("settingsHeader");
	shortDesc_ShowDownBar.innerHTML  = chrome.i18n.getMessage("shortDesc_ShowDownBar");
	fullDesc_ShowDownBar.innerHTML 	 = chrome.i18n.getMessage("fullDesc_ShowDownBar");
	save.innerHTML 					         = chrome.i18n.getMessage("save");
}

setLocalization();
window.onload = restoreOptions;
save.onclick = saveOptions;

//~ 'use strict';

//~ console.log('start options');

// Saves options to localStorage.
function saveOptions() {
    opt_btn_save.innerHTML = chrome.i18n.getMessage("opt_btn_save_process");


    localStorage.showdownbar = checkbox_showdownbar.checked ? "true" : "false";


    opt_btn_save.innerHTML = chrome.i18n.getMessage("opt_btn_save_processed");
    setTimeout(function() {
        opt_btn_save.innerHTML = chrome.i18n.getMessage("opt_btn_save");
    }, 2000);
}


// Restores select box state to saved value from localStorage.
function restoreOptions() {
    checkbox_showdownbar.checked = localStorage.showdownbar == "true";
}

window.onload = restoreOptions;

document.getElementById("opt_btn_save").addEventListener("click", function(e) {
    saveOptions();
});

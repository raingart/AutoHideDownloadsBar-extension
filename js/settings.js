'use strict';

// console.log('start options');

// Saves options to localStorage.
function saveOptions(buttonSave) {
    buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave_process");

    localStorage.showdownbar = checkbox_showdownbar.checked ? "true" : "false";

    buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave_processed");
    setTimeout(function() {
        buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave");
    }, 2000);
}


// Restores select box state to saved value from localStorage.
function restoreOptions() {
    checkbox_showdownbar.checked = localStorage.showdownbar == "true";
}

var optButtonSave = document.getElementById("optButtonSave");

optButtonSave.addEventListener("click", function(e) {
    saveOptions(optButtonSave);
});

window.onload = restoreOptions;

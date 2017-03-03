'use strict';

// console.log('start options');

// Saves options to localStorage.
function saveOptions(buttonSave) {
    buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave_process");

    localStorage.ShowDownBar = checkbox_ShowDownBar.checked ? true : false;
    localStorage.HideIconInfo = checkbox_HideIconInfo.checked ? true : false;

    buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave_processed");
    setTimeout(function() {
        buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave");
    }, 2000);
}


// Restores select box state to saved value from localStorage.
function restoreOptions() {
    checkbox_ShowDownBar.checked = localStorage.ShowDownBar == "true";
    checkbox_HideIconInfo.checked = localStorage.HideIconInfo == "true";
}

var buttonSave = document.getElementById("optButtonSave");

buttonSave.addEventListener("click", function(e) {
    saveOptions(buttonSave);
});

window.onload = restoreOptions;

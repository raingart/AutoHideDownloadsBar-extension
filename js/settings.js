'use strict';

// console.log('start options');

// var opt_html = ["ShowDownBar", "HideIconInfo", "ShowLastProgress"];

// Saves options to localStorage.
function saveOptions(buttonSave) {
    buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave_process");

    // for (i,i,i++) {
    //   localStorage.i = "checkbox_"+i.checked ? true : false;
    // }

    localStorage.ShowDownBar = checkbox_ShowDownBar.checked ? true : false;
    localStorage.HideIconInfo = checkbox_HideIconInfo.checked ? true : false;
    localStorage.ShowLastProgress = checkbox_ShowLastProgress.checked ? true : false;

    buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave_processed");
    setTimeout(function() {
        buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave");
    }, 2000);
}


// Restores select box state to saved value from localStorage.
function restoreOptions() {
    checkbox_ShowDownBar.checked = localStorage.ShowDownBar == "true";
    checkbox_HideIconInfo.checked = localStorage.HideIconInfo == "true";
    checkbox_ShowLastProgress.checked = localStorage.ShowLastProgress == "true";
}

var buttonSave = document.getElementById("optButtonSave");

buttonSave.addEventListener("click", function(e) {
    saveOptions(buttonSave);
});

window.onload = restoreOptions;

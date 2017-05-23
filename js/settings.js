'use strict';

// console.log('start options');

// var opt_html = ["ShowDownBar", "HideIconInfo", "ShowLastProgress"];

// Saves options to localStorage.
function saveOptions(buttonSave) {
    buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave_process");

    // for (i,i,i++) {
    //   localStorage.i = "checkbox_"+i.checked ? true : false;
    // }

    /*localStorage.ShowDownBar = checkbox_ShowDownBar.checked ? true : false;
    localStorage.HideIconInfo = checkbox_HideIconInfo.checked ? true : false;
    localStorage.ShowLastProgress = checkbox_ShowLastProgress.checked ? true : false;*/
    var options_Storage = {
        ShowDownBar    : checkbox_ShowDownBar.checked ? true : false,
        HideIconInfo: checkbox_HideIconInfo.checked ? true : false,
        ShowLastProgress: checkbox_ShowLastProgress.checked ? true : false
    };

    Storage.setParams(options_Storage, chrome.storage.sync);

    buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave_processed");
    setTimeout(function() {
        buttonSave.innerHTML = chrome.i18n.getMessage("optButtonSave");
    }, 2000);
}


// Restores select box state to saved value from localStorage.
function restoreOptions(options) {
    checkbox_ShowDownBar.checked = options.ShowDownBar ? true : false;
    checkbox_HideIconInfo.checked = options.HideIconInfo ? true : false;
    checkbox_ShowLastProgress.checked = options.ShowLastProgress ? true : false;
    // checkbox_ShowDownBar.checked = localStorage.ShowDownBar == "true";
    // checkbox_HideIconInfo.checked = localStorage.HideIconInfo == "true";
    // checkbox_ShowLastProgress.checked = localStorage.ShowLastProgress == "true";
}

var buttonSave = document.getElementById("optButtonSave");

buttonSave.addEventListener("click", function(e) {
    saveOptions(buttonSave);
});

window.onload = Storage.getParams(null, restoreOptions, chrome.storage.sync);
// window.onload = restoreOptions;

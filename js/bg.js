'use strict';

chrome.downloads.onCreated.addListener(function(item) {
    downloadCreated();
});

chrome.downloads.onChanged.addListener(function(item) {
    downloadChanged();
});

chrome.runtime.onStartup.addListener(function() {
    console.log("Extension onStartup");
});
/*
Extension is onStartup
*/
chrome.runtime.onInstalled.addListener(function(details) {
    console.log("Extension Installed:" + details.reason);
    // var onInstalledPage = '/html/welcome.html';
    // if (details.reason === 'install') {
    //     chrome.tabs.create({ url: onInstalledPage });
    // } else if (details.reason === 'update') {
    //   if (localStorage.showdownbar == "true") {
    //     localStorage.ShowDownBar = true;
    //     localStorage.removeItem("showdownbar");
    //   }
    // }
    downloadChanged();

});

// chrome.runtime.onUpdateAvailable.addListener(function() {
//     console.log("Extension Updated");
//     alert("Extension Updated");
// });

// onInstalled
// onUninstalled
// onEnabled
// onDisabled
// chrome.management.onEnabled.addListener(function(info) {
//     console.log('1'+info);
// });

/*
function onInstall() {
    console.log("Extension Installed");
  }

  function onUpdate() {
    console.log("Extension Updated");
  }

  function getVersion() {
    var details = chrome.app.getDetails();
    return details.version;
  }

  // Check if the version has changed.
  var currVersion = getVersion();
  var prevVersion = localStorage['version']
  if (currVersion != prevVersion) {
    // Check if we just installed this extension.
    if (typeof prevVersion == 'undefined') {
      onInstall();
    } else {
      onUpdate();
    }
    localStorage['version'] = currVersion;
  }*/

  // function isInt(n){
  //     return Number(n) === n && n % 1 === 0;
  // }
  //
  // function isFloat(n){
  //     return Number(n) === n && n % 1 !== 0;
  // }

/*
called when the icon is clicked
*/
chrome.browserAction.onClicked.addListener(function(tab) {
    var openUrl = 'chrome://downloads/';

    // chrome.tabs.getAllInWindow(null, function (tabs) {
    chrome.tabs.query({
        "currentWindow": true
    }, function(tabs) {
        // console.log("\n");
        tabs.forEach(function(tab) {
            // console.log( tab.url );
            if (tab.url == openUrl) {
                chrome.tabs.update(tab.id, { selected: true });
                openUrl = false;
                return false;
            }
        });

        // console.log( openUrl );
        if (openUrl !== false) {
            chrome.tabs.create({
                url: openUrl,
                selected: true
            });
        }
    });

});

function getSetting(optionParam) {
    var e = localStorage.getItem(optionParam);
    // console.log(optionParam+"- "+e);
    if (e == "true") {
        return true;
    }
    return false;
}

function downloadCreated() {
    chrome.downloads.setShelfEnabled(getSetting("ShowDownBar"));
}

function wait(sec) {
    if (Number.isInteger(sec) === false) {
      return false;
    }
    sec = sec * 1000;
    var start = new Date().getTime();
    var end = start;
    while (end < start + sec) {
        end = new Date().getTime();
    }
}

var is_busy = false;

function downloadChanged() {
    if (getSetting("HideIconInfo") || is_busy) {
      return false;
    }
    is_busy = true;

    chrome.downloads.search({}, function(items) {
        var now_progress = false;
        var count = 0;
        var percent = 0;

        var total_size = 0;
        var total_Received = 0;

        items.forEach(function(item) {
            // console.log(item.state);
            if (item.state == 'in_progress') {
                now_progress = true;
                count = ++count;
                // console.log(count);
                // console.log(item);
                if (!getSetting("ShowLastProgress")) {
                  total_size += item.fileSize;
                  total_Received += item.bytesReceived;
                  percent = ((total_Received * 100) / total_size);
                  // console.log("total")
                } else if (count === 1) {
                  // fileSize
                  // totalBytes
                  percent = ((item.bytesReceived * 100) / item.fileSize);
                  // console.log("ones")
                }
                /*
                прерывание из forEach NOT WORKING!
                */
                // return false;
            }
            // else if ((item.state.current == 'complete') && item.endTime && !item.error)
            //     now_progress = false;
            // else
            //   now_progress = true;
        });
        if (getSetting("ShowDownBar") && !now_progress) {
            chrome.downloads.setShelfEnabled(now_progress);
        }
        flashBadge(percent);
        // flashBadge('nan');
        /*
        период обновление прогреса в Badge
        */
        is_busy = false;

        if (count > 0) {
            if (Number.isInteger(percent) === false) {
              wait(1);
            }
            downloadChanged();
        }
    });
}

var circleNum = 0;

function flashBadge(message) {
    if (message === 0) {
        message = "";
    } else if (message <= 100 ) {
    // } else if (100 <= message > 0) {
        // message = Math.round(message);
        message = Math.floor(message);
        message = message.toString() + "%";
    } else if (Number.isInteger(message) === false) {
    // } else if (Number.isInteger(message) === true && message < 100) {
        var loadingSymbol = ["|--", "-|-", "--|"];
        circleNum = circleNum < loadingSymbol.length-1 ? ++circleNum : 0;
        message = loadingSymbol[circleNum];
        // console.log("circleNum > " + circleNum);
    } else {
        message = "error";
        console.log("BadgeText error: " + message);
    }
    // console.log("message > " + message);
    chrome.browserAction.setBadgeBackgroundColor({ color: "black" });
    chrome.browserAction.setBadgeText({ text: message });
}

// 'use strict';

chrome.downloads.onCreated.addListener(function(item) {
    downloadCreated();
});

chrome.downloads.onChanged.addListener(function(item) {
    // if (getSetting() === true) {
    downloadChanged();
    // }
});

chrome.runtime.onStartup.addListener(function() {
  console.log("Extension onStartup");
});

chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension Installed");
  downloadChanged();
});

chrome.runtime.onUpdateAvailable.addListener(function() {
  console.log("Extension Updated");
});

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

//called when the icon is clicked
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
                chrome.tabs.update(tab.id, {
                    selected: true
                });
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

function getSetting() {
    if (localStorage.showdownbar == 'true') {
        return true;
    }
    return false;
}

function downloadCreated() {
    chrome.downloads.setShelfEnabled(getSetting());
}

function downloadChanged() {
    chrome.downloads.search({}, function(items) {
        var now_progress = false;
        var count = 0;

        items.forEach(function(item) {
            // console.log(item.state);
            if (item.state == 'in_progress') {
                now_progress = true;
                count = ++count;
                // console.log(count);
                // console.log(item);
                if (count === 1) {
                // fileSize
                // totalBytes
                  count = Math.round(item.bytesReceived * 100 / item.fileSize) + "%";
                  var percent = setInterval(downloadChanged(), 1000 * 5);
                }
                else {
                  clearInterval(percent);
                }
                // return false;
            }
            // else if ((item.state.current == 'complete') && item.endTime && !item.error)
            //     now_progress = false;
            // else
            //   now_progress = true;
        });
        if (getSetting() === true && now_progress === false) {
            chrome.downloads.setShelfEnabled(now_progress);
        }
        flashBadge(count);
    });
}

function flashBadge(message) {
    if (message === 0) {
        message = "";
    }
    chrome.browserAction.setBadgeBackgroundColor({ color: "black" });
    chrome.browserAction.setBadgeText({ text: message.toString() });
}

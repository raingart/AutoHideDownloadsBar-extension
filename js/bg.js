// 'use strict';

chrome.downloads.onCreated.addListener(function(item) {
    DownloadCreated(item);
});

chrome.downloads.onChanged.addListener(function(item) {
    if (getSetting() === true) {
      DownloadChanged(item);
    }
});

//called when the icon is clicked
chrome.browserAction.onClicked.addListener(function(tab) {
    let openUrl = 'chrome://downloads/';

    // chrome.tabs.getAllInWindow(null, function (tabs) {
    chrome.tabs.query({"currentWindow": true}, function(tabs) {
      // console.log("\n");
      tabs.forEach(function(tab) {
        // console.log( tab.url );
        if( tab.url == openUrl ) {
          chrome.tabs.update( tab.id, {selected: true} );
          openUrl = false;
         	return false;
        }
      });

      // console.log( openUrl );
      if (openUrl !== false) {
        chrome.tabs.create({ url: openUrl, selected: true });
      }
   });

});

function getSetting() {
    if (localStorage.showdownbar == 'true') {
      return true;
    }
    return false;
}

function DownloadCreated(item) {
    chrome.downloads.setShelfEnabled(getSetting());
}

function DownloadChanged(item) {
    chrome.downloads.search({}, function(items) {
        let now_progress = false;
        var count = 0;

        items.forEach(function(item) {
            // console.log(item.state);
            if (item.state == 'in_progress') {
                now_progress = true;
                count = ++count;
                // console.log(count);
                // return false;
            }
            // else if ((item.state.current == 'complete') && item.endTime && !item.error)
            //     now_progress = false;
            // else
            //   now_progress = true;
        });
        chrome.downloads.setShelfEnabled(now_progress);
        // if (now_progress === false) {
            // chrome.downloads.setShelfEnabled(false);
        // }
        flashBadge(count);
    });
}

function flashBadge(message) {
    if (message === 0) {
        message = "";
    }
    // chrome.browserAction.setBadgeBackgroundColor({color: "red"});
    chrome.browserAction.setBadgeText({ text: message.toString() });
}

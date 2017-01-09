// 'use strict';

chrome.downloads.onCreated.addListener(function(item) {
    DownloadCreated(item);
});

chrome.downloads.onChanged.addListener(function(item) {
    let sd = localStorage.showdownbar == 'true' ? true : false;
    // if (sd === true) {
      DownloadChanged(item);
    // }
});

function DownloadCreated(item) {
    let sd = localStorage.showdownbar == 'true' ? true : false;
    chrome.downloads.setShelfEnabled( sd );
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
                console.log(count);
                // return false;
            }
            // else if ((item.state.current == 'complete') && item.endTime && !item.error)
            //     now_progress = false;
            // else
            //   now_progress = true;
        });
        chrome.downloads.setShelfEnabled( now_progress );
        // if (now_progress === false) {
            // chrome.downloads.setShelfEnabled(false);
        // }
        flashBadge(count);
    });
}

function flashBadge( message ) {
    // chrome.browserAction.setBadgeBackgroundColor({color: "red"});
    if (message === 0) {
        message = "";
    }
    chrome.browserAction.setBadgeText({ text: message.toString() });
}

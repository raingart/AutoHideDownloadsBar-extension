'use strict';

chrome.downloads.onCreated.addListener(DownloadCreated);
chrome.downloads.onChanged.addListener(DownloadChanged);

function DownloadCreated(item) {
    var sdbar = localStorage.showdownbar == 'true' ? true : false;
    chrome.downloads.setShelfEnabled(sdbar);
    DownloadChanged(item);
}

function DownloadChanged(item) {
    //~ if ((item.state.current == 'complete') && item.endTime && !item.error) {
    //~ chrome.downloads.setShelfEnabled(false);
    //~ }

    chrome.downloads.search({}, function(items) {
        var now_progress = false;

        items.forEach(function(item) {
            if (item.state == 'in_progress') {
                now_progress = true;
                return false;
            }
            //~ else if ((item.state == 'complete') && item.endTime && !item.error) {
            //~ }
        });
        if (now_progress === false) {
            chrome.downloads.setShelfEnabled(false);
        }
    });
}

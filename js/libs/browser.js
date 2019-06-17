const BrowserAct = {
   // openTab: 
   "tab": {
      "open": url => {
         // chrome.tabs.getAllInWindow(null, function (tabs) {
         chrome.tabs.query({ "currentWindow": true }, tabs => {
            // search for the existing tab 
            for (const tab of tabs) {
               // is finded - focus
               if (tab.url === url) return chrome.tabs.update(tab.id, { selected: true });
            };
            // create new tab
            chrome.tabs.create({
               url: url || 'chrome://newtab',
               // selected: false
               // "active": true
            })
         });
      },
   },

   "badge": {
      "set": {
         "icon": obj => { chrome.browserAction.setIcon(obj); },
         "title": title => chrome.browserAction.setTitle({ "title": title ? title.toString().trim() : '' }),
         "text": text => chrome.browserAction.setBadgeText({ "text": text ? text.toString().trim() : '' }),
         "background_color": color => chrome.browserAction.setBadgeBackgroundColor({ color: color || "black" }),
      },

      "clear": function () {
         const manifest = chrome.runtime.getManifest();
         BrowserAct.badge.set.icon({
            path: manifest.icons['16']
         });
         BrowserAct.badge.set.text('');
         BrowserAct.badge.set.title(i18n("app_title"));
      },
   },
   
   "request": function (url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
         if (xhr.readyState === 4) {
            callback((xhr.status >= 400 || xhr.status < 200) ? null : xhr.responseURL);
         }
      };
      xhr.open("HEAD", url, true);
      xhr.send('');
   },
};

const BrowserAct = {
   openTab: url => {
      let openUrl = url || 'chrome://newtab';

      // chrome.tabs.getAllInWindow(null, function (tabs) {
      chrome.tabs.query({
         "currentWindow": true
      }, function (tabs) {
         // search for the existing tab 
         for (const tab of tabs) {
            // is finded - focus
            if (tab.url === openUrl)
               return chrome.tabs.update(tab.id, {
                  selected: true
               });
         };
         // create new tab
         chrome.tabs.create({
            url: openUrl,
            // selected: false
         })
      });
   },

   toolbar: {
      /* beautify preserve:start */
      setIcon: obj => { chrome.browserAction.setIcon(obj); },

      setTitle: title => {
         let obj = { "title": title ? title.toString().trim() : '' };
         chrome.browserAction.setTitle(obj);
      },

      setBadgeText: text => {
         let obj = { "text": text ? text.toString().trim() : ''  };
         chrome.browserAction.setBadgeText(obj);
      },

      setBadgeBackgroundColor: color => {
         let obj = { color: color || "black" };
         chrome.browserAction.setBadgeBackgroundColor(obj);
      },
      /* beautify preserve:end */

      clear: function () {
         const manifest = chrome.runtime.getManifest();
         BrowserAct.toolbar.setIcon({
            path: manifest.icons['16']
         });
         BrowserAct.toolbar.setBadgeText('');
         BrowserAct.toolbar.setTitle(i18n("app_title"));
      },
   },
};

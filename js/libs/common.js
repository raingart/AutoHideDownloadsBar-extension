const BrowserAct = {
   // openTab:
   "tab": {
      "open": url => {
         let permissionsObj = {
            permissions: ['tabs']
         }
         chrome.permissions.contains(permissionsObj, granted_was => {
            chrome.permissions.request(permissionsObj, granted_got => {
               // create new tab
               const openTab = () => chrome.tabs.create({
                  url: url || 'chrome://newtab',
                  // selected: false
                  // "active": true
               });

               if ((granted_was || granted_got)) {
                  chrome.tabs.query({ "currentWindow": true }, tabs => {
                     // is finded - focus
                     // const isOpened = tabs.forEach(tab => tab.url === url);
                     const openedTab = tabs.filter(tab => tab.url === url)[0];
                     openedTab ? chrome.tabs.update(openedTab.id, { selected: true }) : openTab();
                  });
                  // open without search
               } else openTab();
            });
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
};

function bytesToSize(bytes) {
   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes === 0) return 'n/a';
   const i = parseInt(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), 10);
   if (i === 0) return `${bytes} ${sizes[i]})`;
   return `${(i === 0 ? bytes : (bytes / (1024 ** i)).toFixed(2))} ${sizes[i]}`;
}

// timeFormat_full: (ms) => {
//    let s = Math.floor(ms / 1e3);
//    if (s < 60) return Math.ceil(s) + " secs";
//    if (s < 300) return Math.floor(s / 60) + " mins " + Math.ceil(s % 60) + " secs";
//    if (s < 3600) return Math.ceil(s / 60) + " mins";
//    if (s < 18000) return Math.floor(s / 3600) + " hours " + (Math.ceil(s / 60) % 60) + " mins";
//    if (s < 86400) return Math.ceil(s / 3600) + " hours";
//    return Math.ceil(s / 86400) + " days";
// },

function formatTimeLeft(ms) {
   let day, min, sec;
   return sec = Math.floor(ms / 1e3), !sec || isNaN(sec) ? '' : (day = Math.floor(sec / 86400), day > 0 ? day + " days" : (min = Math.floor(Math.log(sec) / Math.log(60)), Math.floor(sec / Math.pow(60, min)) + " " + ["sec", "mins", "hours"][min]))
}

function getFileNameFromPatch(filepath) {
   return filepath.split(/[\\/]/g).pop()
   // .split('.')[0];
}

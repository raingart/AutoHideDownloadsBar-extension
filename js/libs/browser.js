const webBrowser = {
   "tab": {
      //  need permissions ['tabs']
      // unique: true,

      "open": url => {
         const permissionsObj = {
            permissions: webBrowser.tab.unique ? ['tabs'] : []
         };
         chrome.permissions.contains(permissionsObj, granted_was => {
            chrome.permissions.request(permissionsObj, granted_got => {
               // create new tab
               const openTab = () => chrome.tabs.create({
                  'url': url || 'chrome://newtab',
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
         "icon": (obj = required()) => chrome.browserAction.setIcon(obj),
         "title": title => chrome.browserAction.setTitle({ "title": title ? title.toString().trim() : '' }),
         "text": text => chrome.browserAction.setBadgeText({ "text": text ? text.toString().trim() : '' }),
         "background_color": color => chrome.browserAction.setBadgeBackgroundColor({ 'color': color || "black" }),
      },

      'clear': () => {
         const manifest = chrome.runtime.getManifest();
         webBrowser.badge.set.icon({ path: manifest.icons['16'] });
         webBrowser.badge.set.text('');
         webBrowser.badge.set.title(manifest.browser_action['default_title']);
      },
   },

   "notification": {
      "playAudio": audioPatch => audioPatch && new Audio(audioPatch).play(),

      // web api
      // send(options) {
      //    if (window.Notification && Notification.permission === "granted") {
      //       showNotification();
      //    } else {
      //       Notification.requestPermission().then(() => showNotification());
      //    }

      //    function showNotification() {
      //       const manifest = chrome.runtime.getManifest();
      //       new Notification(options.title || i18n("app_name"), {
      //          body: options.body || '',
      //          icon: options.icon || manifest.icons['48']
      //       }).onclick = () => this.close();
      //    }
      // },

      // chrome api
      send(options) {
         const permissions = { 'permissions': ['notifications'] };
         chrome.permissions.contains(permissions, granted => {
            if (granted) showNotification();
            else chrome.permissions.request(permissions, granted => showNotification());
         });

         function showNotification() {
            const manifest = chrome.runtime.getManifest();
            chrome.notifications.create('info', {
               type: options?.type || 'basic', //'basic', 'image', 'list', 'progress'
               title: options?.title || manifest['name'],
               iconUrl: options?.icon || manifest.icons['48'],
               message: options?.body || '',
               // "priority": 2,
            }, id => chrome.notifications.onClicked.addListener(callback => chrome.notifications.clear(id, callback)));
         }
      }
   }
};

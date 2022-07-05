// 'use strict';

console.debug('init app.js');

function getDownloadProgress(callback) {
   const searchFilter = {
      state: 'in_progress',
      paused: false,
      orderBy: ['-startTime']
   }

   chrome.downloads.search(searchFilter, downloads => {
      let totalSize = totalReceived = totalProgress = timeLeft = countUnknownFinalSize = 0,
         countActive = downloads.length;

      for (const download of downloads) {
         App.log('downloadItem: ' + JSON.stringify(download));

         // skip crx
         if (download.mime === "application/x-chrome-extension") continue;
         // downloaded file ask: keep/discard
         if (download.danger != "safe" && totalReceived === fileSize) {
            let fileName = getFileNameFromPatch(download.filename);
            webBrowser.notification.send({
               title: 'File save request!',
               body: fileName.toString().slice(0, 31) + '…',
            });
            return 'dangerFile';
         }

         totalReceived += download.bytesReceived;

         // file size known
         if (download.fileSize || download.totalBytes) {
            let fileSize = download.fileSize || download.totalBytes;
            totalSize += fileSize;

            // totalProgress = Math.min(100, Math.floor(100 * totalReceived / totalSize)) || '--';
            totalProgress = Math.min(100, Math.floor(100 * totalReceived / totalSize)).toString();

            if (download.estimatedEndTime) timeLeft += new Date(download.estimatedEndTime) - new Date();

         } else { // unknown size file
            countUnknownFinalSize += 1;
            App.log('find infinity', countUnknownFinalSize);
         }
      };

      if (countActive) {
         // set toolbar title
         totalSize = totalSize ? bytesToSize(totalSize) : "unknown size";

         let toolbarTitle = bytesToSize(totalReceived) + `/${totalSize}`;

         if (totalSize) {
            timeLeft = formatTimeLeft(timeLeft) + ' left';
            toolbarTitle += `\n${totalProgress}% ~` + timeLeft;
         }

         // count
         if (countActive > 1 || countUnknownFinalSize) {
            toolbarTitle += '\nactive: ' + countActive;

            // ignored
            if (countUnknownFinalSize) {
               if (countUnknownFinalSize === countActive) {
                  totalProgress = Infinity;
               } else {
                  toolbarTitle += ' | ignore: ' + countUnknownFinalSize;
               }
            }
         }

         webBrowser.badge.set.title(toolbarTitle);

      } else {
         // if ((item.state.current == 'complete') && item.endTime && !item.error) {
         // hide shelf-panel
         App.shelfTimeout = setTimeout(function () {
            App.log('setShelfEnabled - hide');
            chrome.downloads.setShelfEnabled(false);
         }, Number(App.sessionSettings["shelfTimeout"]) * 1000 || 0);
         // }
      }

      App.log('countActive', countActive);
      App.log('totalProgress', totalProgress);

      // "chrome.downloads.search" doesn't allow to do it otherwise
      if (callback && typeof (callback) === 'function') {
         callback = callback.bind(App);
         return callback(totalProgress);
      }
   });
}

const App = {
   // test file:
   // https://www.adam.com.au/support/blank-test-files

   // DEBUG: true,

   pulsar(statusDownload) {
      this.log('pulsar:', statusDownload);

      if (statusDownload && !App.isBusy) {
         this.log('setInterval');
         this.isBusy = true;
         this.tempLoadingMessage = setInterval(() => {
            this.log('setInterval RUN');
            getDownloadProgress(this.updateIndicate);
         }, 800);
         // cancellation of pending shelf-panel hiding
         this.shelfTimeout && clearTimeout(this.shelfTimeout);

      } else if (!statusDownload && App.isBusy) {
         this.log('clearInterval');
         this.isBusy = false;
         clearInterval(this.tempLoadingMessage);
         webBrowser.badge.reset();
         // webBrowser.badge.set.title('');

      } else this.log('pulsar ignore');
   },

   updateIndicate(pt) {
      if (this.sessionSettings['typeIconInfo']) {
         webBrowser.badge.set.icon({ 'imageData': drawToolbarIcon(pt) });
      }
   },

   // Saves/Load options to localStorage/chromeSync.
   storage: {
      method: 'local',
      // method: 'sync',

      load() {
         const callback = settings => {
            // App.log('storage', JSON.stringify(settings));
            App.sessionSettings = settings;
            App.updateBrowserBadgeAction();
         };
         // load store settings
         Storage.getParams(callback, App.storage.method);
      }
   },

   // Register the event handlers.
   eventListener: (function () {
      chrome.downloads.onCreated.addListener(item => {
         // add
         App.setBrowserBadgeText('+', 'lawngreen');
         // hide panel
         chrome.downloads.setShelfEnabled(App.sessionSettings.shelfEnabled ? true : false);
      });

      // gen info to toolbar
      chrome.downloads.onChanged.addListener(item => App.refresh(item));

      // save new options
      chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
         // console.debug('onMessage', ...arguments);
         switch (request.action) {
            case 'setOptions':
               App.sessionSettings = request.settings;
               webBrowser.badge.reset();
               App.updateBrowserBadgeAction();
               break;
         }
      });
   }()),

   refresh(item) {
      this.log('refresh');

      getDownloadProgress(this.pulsar);

      if (item && (this.sessionSettings["showNotification"] || this.sessionSettings["soundNotification"])) {
         notificationCheck(item);
      }

      switch (item?.state?.current) {
         case 'complete':
            this.setBrowserBadgeText('✓', 'lime');
            break;

         case 'interrupted':
            if (item.error.current != 'USER_CANCELED') {
               this.setBrowserBadgeText('×', 'red');
            }
            break;

         default:
            if (item?.paused?.previous) {
               this.setBrowserBadgeText('►', 'deepskyblue');
            }
            break;
      }
   },

   setBrowserBadgeText(text, color) {
      webBrowser.badge.set.text(text);
      webBrowser.badge.set.background_color(color);
      setTimeout(() => webBrowser.badge.set.text(), 3000);
   },

   openPage: () => webBrowser.tab.open('chrome://downloads/'),
   openLocation: () => chrome.downloads.showDefaultFolder(),

   updateBrowserBadgeAction() {
      // relation to removeListener/addListener
      const clearListener = act => {
         chrome.browserAction.onClicked.hasListener(act) && chrome.browserAction.onClicked.removeListener(act)
      };
      // // clear browserAction
      clearListener(this.openLocation);
      clearListener(this.openPage);
      chrome.browserAction.setPopup({ popup: '' });

      // called when the icon is clicked
      switch (this.sessionSettings["toolbarBehavior"]) {
         case 'download_default_folder':
            if (!chrome.browserAction.onClicked.hasListener(this.openLocation)) {
               chrome.browserAction.onClicked.addListener(this.openLocation);
            }
            break;

         // commented out because in the default options this parameter is set
         // otherwise, when installing without updating the parameters,
         // nothing will happen when you click on toolbar ico
         // case 'chrome_downloads':
         default:
            if (!chrome.browserAction.onClicked.hasListener(this.openPage)) {
               chrome.browserAction.onClicked.addListener(this.openPage);
            }
            break;
      }
   },

   init() {
      this.log('App.init');
      this.storage.load();
      webBrowser.badge.reset();
   },

   log(...args) {
      if (this.DEBUG && args?.length) {
         console.groupCollapsed(...args);
         console.trace();
         console.groupEnd();
      }
   }
}

App.init();

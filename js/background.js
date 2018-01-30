// 'use strict';

// Need for a counter
// (TODO) but i do not know how to get rid of it
var i = 0;

const App = {

   debug: true,

   signal: {
      downloadCreated: function () {
         App.log('downloadCreated init');

         var isShowPanel = App.tempSaveStorage["ShowDownBar"] || false;
         chrome.downloads.setShelfEnabled(isShowPanel);
      },

      downloadChanged: function (item) {
         App.log('downloadChanged init');

         App.log('onChanged item', JSON.stringify(item));

         // if (id) 
            App.getDownloadProgress(App.initInterval);

         if (App.tempSaveStorage["showNotification"] && item 
            && item.state && item.state.previous === 'in_progress') {
               switch (item.state.current) {
                  // The download completed successfully.
                  case 'complete':
                     var msg = chrome.i18n.getMessage("noti_download_complete");
                     break;
                  // An error broke the connection with the file host.
                  case 'interrupted':
                     var msg;
                     if (item.error.current === 'USER_CANCELED')
                        msg = chrome.i18n.getMessage("noti_download_canceled");
                     else 
                        msg = chrome.i18n.getMessage("noti_download_interrupted");
                     break;
                  // The download is currently receiving data from the server.
                  // case 'in_progress':
                  //    break;
                  default:
                     return false;
               }
            App.notification(chrome.i18n.getMessage("noti_download_title"), msg);
         }
         
      },
   },

   initInterval: function (statusDownload) {
      // App.log('initInterval: ', statusDownload);
      if (statusDownload) {
         if (!App.isBusy) {
            App.log('setInterval');
            App.isBusy = true;
            App.temploadingMessage = setInterval(function () {
               App.getDownloadProgress(App.showProgress);
               App.log('setInterval RUN');
            }, 1000);
         }
      } else if (App.isBusy) {
         App.log('clearInterval');
         App.isBusy = false;
         clearInterval(App.temploadingMessage);
         App.clearToolbar();
      } else
         App.log('initInterval skip');
   },

   clearToolbar: function () {
      var manifest = chrome.runtime.getManifest();
      /* beautify preserve:start */
      chrome.browserAction.setIcon({ path: manifest.icons['16'] });
      chrome.browserAction.setBadgeText({ text: '' });
      chrome.browserAction.setTitle({ title: chrome.i18n.getMessage("app_title") });
      /* beautify preserve:end */
   },

   showProgress: function (progressRatio) {

      switch (App.tempSaveStorage['typeIconInfo'] /*.toLowerCase()*/ ) {
         case 'svg':
            graphical(progressRatio);
            break;
         case 'false':
            return false;
            break;
         case 'text':
            texter(progressRatio);
            break;
         default:
            // return false;
            graphical(progressRatio);
      }

      function graphical(progressRatio) {
         // #00ff00 is default value 
         if (App.tempSaveStorage['colorPicker'] && App.tempSaveStorage['colorPicker'] != '#00ff00')
            var color = App.tempSaveStorage['colorPicker'];

         else {
            var options = {
               'color': {
                  'startingHue': 0,
                  'endingHue': 120,
                  'saturation': 100,
                  'lightness': 50
               }
            }

            // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
            var percentageToHsl = function (percentage, fromHue, toHue) {
               var hue = Math.round((percentage * (toHue - fromHue)) + fromHue);
               return 'hsla(' + hue + ', ' + options.color.saturation + '%, ' + options.color.lightness + '%, 0.8)';
            }

            var color = percentageToHsl(progressRatio, options.color.startingHue, options.color.endingHue);
            // var color = percentageToHsl((progressRatio * 3.6), options.color.startingHue, options.color.endingHue);
         }

         var progressPercent = Math.round(progressRatio * 100);

         var dataForDrawing = {
            'color': color,
            'progressRatio': progressRatio || 0,
            // 'outText': Math.round(100 - (progressRatio * 100)),
            'outText': Number.isInteger(progressPercent) ? progressPercent : Array((++i % 4) + 1).join("."),
         }
         App.log('dataForDrawing ', JSON.stringify(dataForDrawing));

         draw(dataForDrawing);

      }

      function texter(progressRatio) {

         if (Number.isInteger(progressRatio * 100)) {
            var progressPercent = Math.round(progressRatio * 100) + '%';

         } else {
            var loadingSymbol = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            App.circleNum = App.circleNum < loadingSymbol.length - 1 ? ++App.circleNum : 0;
            var progressPercent = loadingSymbol[App.circleNum];
         }

         chrome.browserAction.setBadgeBackgroundColor({
            color: App.tempSaveStorage['colorPicker'] || "black"
         });
         chrome.browserAction.setBadgeText({
            text: progressPercent.toString() || 'err'
         });
      }

      function draw(dataForDrawing) {
         var canvas = document.createElement('canvas');
         canvas.width = 16;
         canvas.height = 16;

         var context = canvas.getContext('2d');
         context.fillStyle = 'hsla( 0, 0%, 0%, 0.1)';
         context.fillRect(0, 0, 16, 16);
         context.fillStyle = dataForDrawing.color;
         context.fillRect(0, 0, 16 * dataForDrawing.progressRatio, 16);

         context.fillStyle = '#888';
         context.textAlign = 'center';
         context.textBaseline = 'middle';
         context.font = '11px Arial';
         // context.fillText(dataForDrawing.outText, 8, 8);
         context.fillText(dataForDrawing.outText.toString(), 8, 8);

         chrome.browserAction.setIcon({
            imageData: context.getImageData(0, 0, 16, 16)
         });
      }

   },

   getDownloadProgress: function (callback) {

      var searchObj = {
         state: 'in_progress',
         // paused: false,
         orderBy: ['-startTime']
      }

      if (App.tempSaveStorage["ShowLastProgress"]) {
         searchObj['limit'] = 1;
      }

      chrome.downloads.search(searchObj, function (downloads) {

         var totalSize = 0,
            totalReceived = 0,
            progressRatio = 0,
            countActive = downloads.length;

         for (var download of downloads) {
            // console.log('download: ' + JSON.stringify(download));

            totalSize += download.fileSize || download.totalBytes
            totalReceived += download.bytesReceived;
            progressRatio = (totalReceived / totalSize).toFixed(2);
         };

         // hide panel
         if (countActive <= 0) {
            chrome.downloads.setShelfEnabled(false);

            // set toolbar Title
         } else {
            var titleOut = Math.round(progressRatio * 100) + '%';

            if (countActive > 1) {
               titleOut += ' ' + chrome.i18n.getMessage("title_count_active") + ': ' + countActive;
            }
            chrome.browserAction.setTitle({
               title: titleOut.toString()
            });
         }

         App.log('countActive ', countActive);
         App.log('percent ', progressRatio);

         if (callback && typeof (callback) === "function") {
            return callback(progressRatio);
         }

      });
   },

   notification: function (title, msg, icon) {
      chrome.notifications.create('info', {
         type: 'basic',
         iconUrl: '/icons/' + icon === undefined ? '' : '/icons/128.png',
         title: title || chrome.i18n.getMessage("app_name"),
         message: msg || '',
      }, function (notificationId) {
         chrome.notifications.onClicked.addListener(function (callback) {
            chrome.notifications.clear(notificationId);
            // chrome.notifications.clear(notificationId, callback);
         });
      });
   },

   openTab: function (url) {
      var openUrl = url || 'chrome://newtab';

      // chrome.tabs.getAllInWindow(null, function (tabs) {
      chrome.tabs.query({
         "currentWindow": true
      }, function (tabs) {
         // search for the existing tab 
         for (var tab of tabs) {
            // is finded - focus
            if (tab.url === openUrl) {
               return chrome.tabs.update(tab.id, {
                  selected: true
               });
            }
         };
         // create new tab
         chrome.tabs.create({
            url: openUrl,
            // selected: false
         })
      });
   },

   // Saves/Load options to localStorage/chromeSync.
   confStorage: {
      load: () => {
         var callback = function (res) {
            App.log('confStorage', JSON.stringify(res));
            App.tempSaveStorage = res;

            App.signal.downloadCreated();
            App.signal.downloadChanged();
         };
         // load store settings
         // Storage.getParams(null /*all*/ , callback, false /*local*/ );
         Storage.getParams(null /*all*/ , callback, true /*sync*/ );
      },
   },

   init: function () {
      App.confStorage.load();
   },

   log: (msg, arg1) => {
      var arg1 = arg1 === undefined ? '' : arg1;
      if (App.debug) console.log('[+] ' + msg.toString().trim(), arg1)
   },
}

App.init();

// Register the event handlers.
chrome.downloads.onCreated.addListener(function (item) {
   App.signal.downloadCreated();
});

chrome.downloads.onChanged.addListener(function (item) {
   App.signal.downloadChanged(item);
});

// called when the icon is clicked
chrome.browserAction.onClicked.addListener(function (tab) {
   App.openTab('chrome://downloads/');
});


const manifest = chrome.runtime.getManifest();

// when install or update new version fired
chrome.runtime.onInstalled && chrome.runtime.onInstalled.addListener(function (details) {
   console.log('app ' + details.reason + ' ', manifest.version);
   if (details.reason === 'install') {
      var defaultSetting = {
         'showNotification': true,
      }
      Storage.setParams(defaultSetting, true /*sync*/ );
   } 
   else if (details.reason === 'update') {

   }
});

var uninstallUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdgDabLtk8vapLTEXKoXucHVXLrDujBrXZg418mGrLE0zND2g/viewform?usp=pp_url&entry.1936476946&entry.1337380930&entry.1757501795=";
uninstallUrl += encodeURIComponent(manifest.short_name + ' (v' + manifest.version + ')');

if (!App.debug)
   chrome.runtime.setUninstallURL(uninstallUrl, function (details) {
      var lastError = chrome.runtime.lastError;
      if (lastError && lastError.message) {
         console.warn("Unable to set uninstall URL: " + lastError.message);
      } else {
         // The url is set
      }
   });

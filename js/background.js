// 'use strict';

console.log(i18n("app_name") + ": init background.js");

const App = {

   // debug: true,

   counterTemp: 0,

   initInterval: (statusDownload) => {
      // App.log('initInterval: ', statusDownload);
      if (statusDownload) {

         if (!App.isBusy) {
            App.log('setInterval');
            App.isBusy = true;
            App.temploadingMessage = setInterval(function () {
               App.getDownloadProgress(App.updateBrowserActionIcon);
               App.log('setInterval RUN');
            }, 800);
         }

      } else if (App.isBusy) {
         App.log('clearInterval');
         App.isBusy = false;
         clearInterval(App.temploadingMessage);
         App.clearToolbar();

      } else
         App.log('initInterval skip');
   },

   clearToolbar: () => {
      var manifest = chrome.runtime.getManifest();
      App.toolbar.setIcon({
         path: manifest.icons['16']
      });
      App.toolbar.setBadgeText("");
      App.toolbar.setTitle(i18n("app_title"));
   },

   updateBrowserActionIcon: (progressRatio) => {
      var progressRatio = progressRatio || 0;

      switch (App.tempSaveStorage['typeIconInfo'] /*.toLowerCase()*/ ) {
         case 'svg':
            HProgressBar(progressRatio);
            break;
         case 'text':
            texter(progressRatio);
            break;
         case 'false':
            return false;
         default:
            // return false;
            HProgressBar(progressRatio);
      }

      function HProgressBar() {
         var getDataDrawing = dataForDrawing(progressRatio);

         draw(getDataDrawing);

         function dataForDrawing(progressRatio) {
            // #00ff00 is default value 
            if (App.tempSaveStorage['colorPicker'] && App.tempSaveStorage['colorPicker'] != '#00ff00')
               var color = App.tempSaveStorage['colorPicker'];

            // set gradient
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
               var percentageToHsl = (percentage, fromHue, toHue) => {
                  var hue = Math.round((percentage * (toHue - fromHue)) + fromHue);
                  return 'hsla(' + hue + ', ' + options.color.saturation + '%, ' + options.color.lightness + '%, 0.8)';
               }

               var color = percentageToHsl(progressRatio, options.color.startingHue, options.color.endingHue);
            }

            var progressPercent = Math.round(progressRatio * 100);

            var dataForDrawing = {
               'color': color,
               'progressRatio': progressRatio,
               'outText': Number.isInteger(progressPercent) ? progressPercent : Array((++App.counterTemp % 4) + 1).join("."),
               // 'outText': Math.round(100 - (progressRatio * 100)), // left percent
            }
            App.log('dataForDrawing ', JSON.stringify(dataForDrawing));

            return dataForDrawing;
         }

         function draw(dataForDrawing) {
            var canvas = genCanvas();
            var context = canvas.getContext('2d')

            context = drawToCanvas(dataForDrawing.progressRatio)
               .getImageData(0, 0, canvas.width, canvas.height);

            App.toolbar.setIcon({
               imageData: context
            });

            function drawToCanvas(percentage) {
               var ctx = context;

               // add background
               ctx.fillStyle = 'hsla( 0, 0%, 0%, 0.1)';
               ctx.fillRect(0, 0, canvas.width, canvas.height);

               // add progress
               ctx.fillStyle = dataForDrawing.color;
               ctx.fillRect(0, 0, parseInt(canvas.width * percentage), canvas.height);

               // create style text
               ctx.fillStyle = '#888';
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';
               ctx.font = '11px Arial';

               //set position text
               ctx.fillText(
                  dataForDrawing.outText.toString(),
                  parseInt(canvas.width / 2), parseInt(canvas.height / 2)
               );

               return ctx;
            }

            function genCanvas() {
               var cvs;
               cvs = document.createElement('canvas');

               // cvs.setAttribute('width', 19);
               // cvs.setAttribute('height', 6);
               cvs.width = 16;
               cvs.height = 16;

               return cvs;
            }

         }
      }

      function texter(progressRatio) {
         if (Number.isInteger(progressRatio * 100)) {
            var progressPercent = Math.round(progressRatio * 100) + '%';

         } else {
            var loadingSymbol = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            App.circleNum = App.circleNum < loadingSymbol.length - 1 ? ++App.circleNum : 0;
            var progressPercent = loadingSymbol[App.circleNum];
         }

         App.toolbar.setBadgeBackgroundColor(App.tempSaveStorage['colorPicker']);

         App.toolbar.setBadgeText(progressPercent || 'err');
      }

   },

   getDownloadProgress: (callback) => {
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
            progressPercent = 0,
            countActive = downloads.length;

         for (var download of downloads) {
            console.log('download: ' + JSON.stringify(download));
         
            // skip crx
            if (download.mime === "application/x-chrome-extension")
               continue;

            totalSize += download.fileSize || download.totalBytes
            totalReceived += download.bytesReceived;
            progressRatio = (totalReceived / totalSize).toFixed(2);

            progressPercent = Math.round(progressRatio * 100);
         };

         if (countActive) {
            // set toolbar Title
            var titleOut = '';
            // not Infinity
            if (Number.isInteger(progressPercent))
               titleOut = progressPercent + '%';

            if (countActive > 1)
               titleOut += ' ' + i18n("title_count_active") + ': ' + countActive;

            App.toolbar.setTitle(titleOut);

         // hide panel
         } else {
            chrome.downloads.setShelfEnabled(false);
         }

         App.log('countActive ', countActive);
         App.log('percent ', progressRatio);

         if (callback && typeof (callback) === "function") {
            return callback(progressRatio);
         }

      });
   },

   toolbar: {
      setIcon: (obj) => {
         chrome.browserAction.setIcon(obj);
      },

      setTitle: (title) => {
         var obj = {
            "title": title.toString().trim() || ''
         };
         chrome.browserAction.setTitle(obj);
      },

      setBadgeText: (text) => {
         var obj = {
            "text": text.toString().trim() || ''
         };
         chrome.browserAction.setBadgeText(obj);
      },

      setBadgeBackgroundColor: (color) => {
         var obj = {
            color: color || "black"
         };
         chrome.browserAction.setBadgeBackgroundColor(obj);
      },
   },

   notificationCheck: (item) => {
      if (App.tempSaveStorage["showNotification"] &&
         item && item.state && item.state.previous === 'in_progress') {

         switch (item.state.current) {
            // The download completed successfully.
            case 'complete':
               var msg = i18n("noti_download_complete");
               break;
               // An error broke the connection with the file host.
            case 'interrupted':
               var msg;
               if (item.error.current === 'USER_CANCELED')
                  msg = i18n("noti_download_canceled");
               else
                  msg = i18n("noti_download_interrupted");
               break;
               // The download is currently receiving data from the server.
               // case 'in_progress':
               //    break;
            default:
               return false;
         }

         App.showNotification(i18n("noti_download_title"), msg);
      }
   },

   showNotification: (title, msg, icon) => {
      chrome.notifications.create('info', {
         type: 'basic',
         iconUrl: '/icons/' + icon === undefined ? '' : '/icons/128.png',
         title: title || i18n("app_name"),
         message: msg || '',
      }, function (notificationId) {
         chrome.notifications.onClicked.addListener(function (callback) {
            chrome.notifications.clear(notificationId);
            // chrome.notifications.clear(notificationId, callback);
         });
      });
   },

   openTab: (url) => {
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
         var callback = (res) => {
            App.log('confStorage', JSON.stringify(res));
            App.tempSaveStorage = res;

            App.start();
         };
         // load store settings
         Storage.getParams(null /*all*/ , callback, true /*sync*/ );
         // Storage.getParams(null /*all*/ , callback, false /*local*/ );
      },
   },

   start: (item) => {
      App.getDownloadProgress(App.initInterval);
      App.notificationCheck(item);
   },

   init: () => {
      App.confStorage.load();
      App.clearToolbar();
   },

   log: (msg, arg1) => {
      var arg1 = arg1 === undefined ? '' : arg1;
      if (App.debug) console.log('[+] ' + msg.toString().trim(), arg1)
   },
}

App.init();

// Register the event handlers.
chrome.downloads.onCreated.addListener(function (item) {
   App.log('downloadCreated init');

   var showShelf = App.tempSaveStorage.ShowDownBar || false;
   
   chrome.downloads.setShelfEnabled(showShelf);

   // chrome.storage.sync.get('ShowDownBar', function (obj) {
   //    var showShelf = obj.showShelf || false;
   //    App.log('on downloads created ', showShelf);

   //    chrome.downloads.setShelfEnabled(showShelf);
   // });
});

chrome.downloads.onChanged.addListener(function (item) {
   App.log('downloadChanged init');
   App.log('onChanged item', JSON.stringify(item));

   App.start(item);
});

// called when the icon is clicked
chrome.browserAction.onClicked.addListener(function (tab) {
   App.openTab('chrome://downloads/');
});

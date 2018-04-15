// 'use strict';

console.log(i18n("app_name") + ": init background.js");

const App = {

   // DEBUG: true,

   runInterval: (statusDownload) => {
      App.log('runInterval: ', statusDownload);
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
         App.log('runInterval stop');
   },

   clearToolbar: () => {
      const manifest = chrome.runtime.getManifest();
      App.toolbar.setIcon({
         path: manifest.icons['16']
      });
      App.toolbar.setBadgeText('');
      App.toolbar.setTitle(i18n("app_title"));
   },

   updateBrowserActionIcon: (pt) => {

      switch (App.tempSaveStorage['typeIconInfo'] /*.toLowerCase()*/ ) {
         case 'false':
            return false;
         case 'text':
            let badgeText = texterProgressBar(pt);
            App.toolbar.setBadgeBackgroundColor(App.tempSaveStorage['colorPicker']);
            App.toolbar.setBadgeText(badgeText);
            break;
         default:
            App.toolbar.setIcon({
               imageData: graficProgressBar(pt)
            });
      }

      function graficProgressBar(progress) {
         let getDataDrawing = dataForDrawing(progress);

         return draw(getDataDrawing);

         function dataForDrawing(progress) {
            let color = (function () {
               let color;
               // #00ff00 is default value 
               if (App.tempSaveStorage['colorPicker'] && App.tempSaveStorage['colorPicker'] != '#00ff00') {
                  color = App.tempSaveStorage['colorPicker'];

                  // set gradient
               } else {
                  let options = {
                     'color': {
                        'startingHue': 0,
                        'endingHue': 120,
                        'saturation': 100,
                        'lightness': 50
                     }
                  }

                  // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
                  let percentageToHsl = (percentage, fromHue, toHue) => {
                     let hue = Math.round((percentage * (toHue - fromHue)) + fromHue);
                     return 'hsla(' + hue + ', ' + options.color.saturation + '%, ' + options.color.lightness + '%, 0.8)';
                  }

                  color = percentageToHsl((progress / 100), options.color.startingHue, options.color.endingHue);
               }
               return color;
            })();

            let dataForDrawing = {
               'color_bg': color,
               'color_text': App.tempSaveStorage['colorPickerText'],
               'progressRatio': (progress / 100),
               'outText': progress,
            }

            // if ask loadig
            if (progress == "!") {
               dataForDrawing.outText = App.flashing(2, progress);
               dataForDrawing.color_text = 'red';
            } else if (dataForDrawing.outText === 'infinity') {
               dataForDrawing.outText = App.flashing();
            }

            // let loadingSymbol = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            // App.circleNum = App.circleNum < loadingSymbol.length - 1 ? ++App.circleNum : 0;
            // dataForDrawing.outText = loadingSymbol[App.circleNum];

            App.log('dataForDrawing ', JSON.stringify(dataForDrawing));

            return dataForDrawing;
         }

         function draw(dataForDrawing) {
            let canvas = genCanvas();
            let context = canvas.getContext('2d')

            return drawToCanvas(dataForDrawing.progressRatio)
               .getImageData(0, 0, canvas.width, canvas.height);

            function drawToCanvas(percentage) {
               let ctx = context;

               // add background
               ctx.fillStyle = 'hsla(0, 0%, 0%, 0.1)';
               ctx.fillRect(0, 0, canvas.width, canvas.height);

               // add progress
               ctx.fillStyle = dataForDrawing.color_bg;
               ctx.fillRect(0, 0, parseInt(canvas.width * percentage), canvas.height);

               // add pt
               if (App.tempSaveStorage['typeIconInfo'] != 'svg_notext') {
                  // create style text
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.font = '11px Arial';
                  // ctx.shadowColor = 'white';
                  // ctx.shadowBlur = 1;
                  ctx.fillStyle = dataForDrawing.color_text || '#888';

                  ctx.fillText(dataForDrawing.outText.toString(), canvas.width / 2, canvas.height / 2);
               }

               return ctx;
            }

            function genCanvas() {
               let cvs = document.createElement('canvas');

               // cvs.setAttribute('width', 19);
               // cvs.setAttribute('height', 6);
               cvs.width = 16;
               cvs.height = 16;

               return cvs;
            }

         }
      }

      function texterProgressBar(progress) {
         if (Number.isInteger(progress))
            progress += '%';
         else {
            let loadingSymbol = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            App.circleNum = App.circleNum < loadingSymbol.length - 1 ? ++App.circleNum : 0;
            let progress = loadingSymbol[App.circleNum];
         }
         return progress;
      }

   },

   getDownloadProgress: (callback) => {
      let searchObj = {
         state: 'in_progress',
         // paused: false,
         orderBy: ['-startTime']
      }

      if (App.tempSaveStorage["showLastProgress"]) {
         searchObj['limit'] = 1;
      }

      chrome.downloads.search(searchObj, function (downloads) {
         let totalSize = 0,
            totalReceived = 0,
            progress = 0,
            timeLeft = 0,
            countActive = downloads.length;

         for (let download of downloads) {
            App.log('downloadItem: ' + JSON.stringify(download));

            // skip crx
            if (download.mime === "application/x-chrome-extension")
               continue;

            if (download.estimatedEndTime)
               timeLeft += new Date(download.estimatedEndTime) - new Date();

            let fileSize = download.fileSize || download.totalBytes;
            // let download_size = downloadItem.fileSize / 1024 / 1000;

            // if undefined fileSize file
            if (!fileSize) {
               totalSize = false;
               progress = 'infinity';
               break;
               //    continue;
            }

            totalSize += fileSize;

            totalReceived += download.bytesReceived;

            // skip downloaded file ask: keep/discard
            if (download.danger != "safe" && totalReceived === fileSize)
               if (callback && typeof (callback) === "function") {
                  return callback("!");
               }

            // progress = Math.min(100, Math.floor(100 * totalReceived / totalSize) || 0) || '--';
            progress = Math.min(100, Math.floor(100 * totalReceived / totalSize) || 0) || '0';
         };

         if (countActive) {
            // set toolbar Title
            let titleOut = '';
            
            if (totalSize) {
               // size
               titleOut += App.formatBytes(totalReceived) + " of ";
               titleOut += totalSize ? App.formatBytes(totalSize) : "unknown size";

               // pt
               titleOut += "\n(" + progress + "%)";

               // left time
               titleOut += ", " + App.formatInterval(timeLeft) + " left";
            }

            // count
            if (countActive > 1)
               titleOut += ' ' + i18n("title_count_active") + ': ' + countActive;

            App.toolbar.setTitle(titleOut);

         } else {
            // hide panel
            chrome.downloads.setShelfEnabled(false);
         }

         App.log('countActive ', countActive);
         App.log('progress ', progress);

         if (callback && typeof (callback) === "function") {
            return callback(progress);
         }

      });
   },

   toolbar: {
      /* beautify preserve:start */
      setIcon: (obj) => { chrome.browserAction.setIcon(obj); },

      setTitle: (title) => {
         let obj = { "title": title.toString().trim() || '' };
         chrome.browserAction.setTitle(obj);
      },

      setBadgeText: (text) => {
         let obj = { "text": text.toString().trim() || ''  };
         chrome.browserAction.setBadgeText(obj);
      },

      setBadgeBackgroundColor: (color) => {
         let obj = { color: color || "black" };
         chrome.browserAction.setBadgeBackgroundColor(obj);
      },
      /* beautify preserve:end */
   },

   notificationCheck: (item) => {
      if (App.tempSaveStorage["showNotification"] &&
         item && item.state && item.state.previous === 'in_progress') {

         let msg;

         switch (item.state.current) {
            // The download completed successfully.
            case 'complete':
               msg = i18n("noti_download_complete");
               break;
               // An error broke the connection with the file host.
            case 'interrupted':
               if (item.error.current === 'USER_CANCELED') {
                  // msg = i18n("noti_download_canceled");
               } else
                  msg = i18n("noti_download_interrupted");
               break;
               // The download is currently receiving data from the server.
            case 'in_progress':
               return false;
               // break;
            default:
               return false;
         }

         if (msg)
            chrome.downloads.search({
               id: item.id
            }, function (downloads) {
               let download = downloads[0];
               let timeLong = Date.parse(download.endTime) - Date.parse(download.startTime);

               // skip notifity small file or small size
               // if (download_size > minimum_download_size) {
               if (timeLong < 3000 || download.fileSize <= 1)
                  return false;
               // console.log('timeLong', timeLong);
               // console.log('download.fileSize', download.fileSize);
               App.log('Done notificationCheck get id', JSON.stringify(download));

               let fileName = App.getFileNameFromPatch(download.filename);
               if (fileName && fileName.length > 50)
                  fileName = fileName.slice(0, 31) + "...";

               App.showNotification(i18n("noti_download_title"), fileName + '\n' + msg);

               if (App.tempSaveStorage["soundNotification"]) {
                  let single_file_done = new Audio('/audio/beep.wav');
                  single_file_done.play();
               }
            });
      }
   },

   getFileNameFromPatch: (path) => {
      if (typeof (path) !== 'undefined')
         // return patch.split(/[^/]*$/g).pop();
         return path.split(/(\\|\/)/g).pop();
   },

   formatBytes: function (bytes) {
      let size;
      return 0 >= bytes ? "0 B" : (
         size = Math.floor(Math.log(bytes) / Math.log(1024)),
         (bytes / Math.pow(1024, size)).toFixed(1) + " " + ["B", "KB", "MB", "GB", "TB"][size]
      )
   },

   formatInterval: function (ms_timeSpan) {
      let day, min, sec;
      return sec = Math.floor(ms_timeSpan / 1e3), 0 >= sec ? "0 secs" : (day = Math.floor(sec / 86400), day > 0 ? day + " days" : (min = Math.floor(Math.log(sec) / Math.log(60)), Math.floor(sec / Math.pow(60, min)) + " " + ["secs", "mins", "hours"][min]))
   },

   counter_tmp: 0,

   flashing: (count, outText) => {
      count = count || 4;
      return Array((++App.counter_tmp % count) + 1).join(outText || '.');;
   },

   showNotification: (title, msg, icon) => {
      const manifest = chrome.runtime.getManifest();

      chrome.notifications.create('info', {
         type: 'basic', //'basic', 'image', 'list', 'progress'
         iconUrl: typeof (icon) === 'undefined' ? manifest.icons['48'] : '/icons/' + icon,
         title: title || i18n("app_name"),
         message: msg || '',
         // "priority": 2,
      }, function (notificationId) {
         chrome.notifications.onClicked.addListener(function (callback) {
            chrome.notifications.clear(notificationId, callback);
         });
      });
   },

   openTab: (url) => {
      let openUrl = url || 'chrome://newtab';

      // chrome.tabs.getAllInWindow(null, function (tabs) {
      chrome.tabs.query({
         "currentWindow": true
      }, function (tabs) {
         // search for the existing tab 
         for (let tab of tabs) {
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

   // Saves/Load options to localStorage/chromeSync.
   confStorage: {
      load: () => {
         let callback = (res) => {
            App.log('confStorage', JSON.stringify(res));
            App.tempSaveStorage = res;

            App.pulse();
         };
         // load store settings
         Storage.getParams(null /*all*/ , callback, true /* true=sync, false=local */ );
      },
   },

   // Register the event handlers.
   eventListener: () => {
      chrome.downloads.onCreated.addListener(function (item) {
         App.log('downloadCreated init');

         let shelf = App.tempSaveStorage.shelfEnabled || App.tempSaveStorage.ShowDownBar || false;
         chrome.downloads.setShelfEnabled(shelf);
      });

      chrome.downloads.onChanged.addListener(function (item) {
         App.log('downloadChanged init');
         App.log('onChanged item', JSON.stringify(item));

         App.pulse(item);
      });

      // called when the icon is clicked
      chrome.browserAction.onClicked.addListener(function (tab) {
         App.openTab('chrome://downloads/');
      });

      chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
         switch (request.name) {
            // case 'getOptions':
            //   let defaults = {};
            //   let resp = {};
            //   for (let key in defaults) {
            //       if (!(key in localStorage)) {
            //           localStorage[key] = defaults[key];
            //       }
            //       resp[key] = localStorage[key];
            //   }
            //   sendResponse(resp);
            // break;
            case 'setOptions':
               App.tempSaveStorage = request.options;
               App.clearToolbar();
               break;
         }
      });

      // single_file_done.addEventListener("ended", checkDownloadStack);
   },

   pulse: (item) => {
      App.getDownloadProgress(App.runInterval);
      App.notificationCheck(item);
   },

   init: () => {
      App.confStorage.load();
      App.eventListener();
      App.clearToolbar();
   },

   log: (msg, args) => {
      let arg = args === undefined ? '' : args;
      App.DEBUG && console.log('[+] ' + msg.toString().trim(), arg)
   },
}

App.init();

// 'use strict';

console.log(i18n("app_name") + ": init background.js");

const App = {

   // DEBUG: true,

   pulsar: (statusDownload) => {
      App.log('pulsar: ', statusDownload);

      if (statusDownload && !App.isBusy) {
         App.log('setInterval');
         App.isBusy = true;
         App.temploadingMessage = setInterval(function () {
            App.log('setInterval RUN');
            App.getDownloadProgress(App.updateIndicate);
         }, 800);
         // cancellation of pending shelf-panel hiding
         App.shelfTimeout && clearTimeout(App.shelfTimeout);

      } else if (!statusDownload && App.isBusy) {
         App.log('clearInterval');
         App.isBusy = false;
         clearInterval(App.temploadingMessage);
         App.browser.toolbar.clear();

      } else App.log('pulsar ignore');
   },

   updateIndicate: (pt) => {
      switch (App.sessionSettings['typeIconInfo'] /*.toLowerCase()*/ ) {
         case 'false':
            break;

         case 'text':
            App.browser.toolbar.setBadgeBackgroundColor(App.sessionSettings['colorPicker']);
            App.browser.toolbar.setBadgeText(App.genProgressBar.text(pt));
            break;

         default:
            App.browser.toolbar.setIcon({
               imageData: App.genProgressBar.grafic(pt)
            });
      }
      return;
   },

   genProgressBar: {
      grafic: (x) => {
         let getDataDrawing = dataForDrawing(x);

         return drawToolbarIcon(getDataDrawing);

         function dataForDrawing(progress) {
            let color = (function () {
               let color = '#00ff00';
               // #00ff00 is default value 
               if (App.sessionSettings['colorPicker'] &&
                  App.sessionSettings['colorPicker'] !== color) {
                  color = App.sessionSettings['colorPicker'];

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
               'color_text': App.sessionSettings['colorPickerText'],
               'progressRatio': (+progress / 100),
               'outText': progress,
            }

            // if ask loadig
            if (progress == "!") {
               dataForDrawing.outText = App.flashing(2, progress);
               dataForDrawing.color_text = 'red';
            } else if (dataForDrawing.outText === Infinity) {
               dataForDrawing.outText = App.flashing();
            }

            App.log('dataForDrawing %s', JSON.stringify(dataForDrawing));

            return dataForDrawing;
         }

         function drawToolbarIcon(dataForDrawing) {
            let canvas = genCanvas();
            let context = canvas.getContext('2d')

            return drawProgressBar(dataForDrawing.progressRatio)
               .getImageData(0, 0, canvas.width, canvas.height);

            function drawProgressBar(ratio) {
               let ctx = context;

               // add background
               ctx.fillStyle = 'hsla(0, 0%, 0%, 0.1)';
               ctx.fillRect(0, 0, canvas.width, canvas.height);

               // add progress
               ctx.fillStyle = dataForDrawing.color_bg;
               ctx.fillRect(0, 0, parseInt(canvas.width * ratio), canvas.height);

               // add pt
               if (App.sessionSettings['typeIconInfo'] != 'svg_notext' &&
                  +dataForDrawing.outText !== Infinity) {
                  // create style text
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.font = '11px Arial';
                  // ctx.shadowColor = 'white';
                  // ctx.shadowBlur = 1;
                  ctx.fillStyle = dataForDrawing.color_text || '#888';

                  ctx.fillText(
                     dataForDrawing.outText.toString(),
                     canvas.width / 2, canvas.height / 2
                  );
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
      },

      text: (x) => {
         // if (Number.isInteger(x) && x !== Infinity) {
         if (x >= 0 && x <= 100) {
            x += '%';
         } else {
            let loadingSymbol = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            App.circleNum = App.circleNum < loadingSymbol.length - 1 ? ++App.circleNum : 0;
            x = loadingSymbol[App.circleNum];
         }
         return x;
      }
   },

   getDownloadProgress: (callback) => {
      let searchObj = {
         state: 'in_progress',
         paused: false,
         orderBy: ['-startTime']
      }

      chrome.downloads.search(searchObj, function (downloads) {
         let totalSize = 0,
            totalReceived = 0,
            progress = 0,
            timeLeft = 0,
            countInfinity = 0,
            countActive = downloads.length;

         for (const download of downloads) {
            App.log('downloadItem: ' + JSON.stringify(download));

            totalReceived += download.bytesReceived;

            // skip crx
            if (download.mime === "application/x-chrome-extension")
               continue;

            // normal file
            if (download.fileSize || download.totalBytes) {
               let fileSize = download.fileSize || download.totalBytes;
               // let download_size = downloadItem.fileSize / 1024 / 1000;

               totalSize += fileSize;

               // progress = Math.min(100, Math.floor(100 * totalReceived / totalSize)) || '--';
               progress = Math.min(100, Math.floor(100 * totalReceived / totalSize)).toString();

               if (download.estimatedEndTime)
                  timeLeft += new Date(download.estimatedEndTime) - new Date();
               // if undefined fileSize file

               // unknown size file
            } else {
               countInfinity += 1;
               App.log('find infinity %s', countInfinity);
               continue;
            }

            // skip downloaded file ask: keep/discard
            if (download.danger != "safe" && totalReceived === fileSize)
               if (callback && typeof (callback) === "function") {
                  return callback("!");
               }
         };

         if (countActive) {
            // set toolbar title
            let titleOut = '';

            // size
            titleOut += App.bytesFormat(totalReceived) + " / ";
            titleOut += totalSize ? App.bytesFormat(totalSize) : "unknown size";

            if (totalSize) {
               // pt
               titleOut += "\n" + progress + "%";
               // left time
               titleOut += " ~" + App.timeFormat_short(timeLeft) + " left";
            }

            // count
            if (countActive > 1 || countInfinity) {
               titleOut += "\n" + 'active: ' + countActive;
               // let badgeText = countInfinity ? countInfinity + '/' + countActive : countActive
               // App.browser.toolbar.setBadgeText(badgeText);

               // ignored
               if (countInfinity) {
                  if (countInfinity == countActive) {
                     totalSize = false;
                     progress = Infinity;
                  } else {
                     titleOut += ' | ignore: ' + countInfinity;
                  }
               }
            }

            App.browser.toolbar.setTitle(titleOut);

         } else {
            // if ((item.state.current == 'complete') && item.endTime && !item.error) {
            // hide shelf-panel
            App.shelfTimeout = setTimeout(function () {
               App.log('shelfTimeout run');
               chrome.downloads.setShelfEnabled(false);
            }, Number(App.sessionSettings["shelfTimeout"]) * 1000 || 0);
            // }
         }

         App.log('countActive %s', countActive);
         App.log('progress %s', progress);

         if (callback && typeof (callback) === "function") {
            return callback(progress);
         }

      });
   },

   getFileNameFromPatch: (path) => {
      if (typeof (path) !== 'undefined')
         // return patch.split(/[^/]*$/g).pop();
         return path.split(/(\\|\/)/g).pop();
   },

   bytesFormat(bytes) {
      let i = bytes == 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ['B', 'kB', 'MB', 'GB', 'TB'][i];
   },

   timeFormat_short: (ms) => {
      let day, min, sec;
      return sec = Math.floor(ms / 1e3), 0 >= sec ? "0 secs" : (day = Math.floor(sec / 86400), day > 0 ? day + " days" : (min = Math.floor(Math.log(sec) / Math.log(60)), Math.floor(sec / Math.pow(60, min)) + " " + ["secs", "mins", "hours"][min]))
   },

   // timeFormat_full: (ms) => {
   //    let s = Math.floor(ms / 1e3);
   //    if (s < 60) return Math.ceil(s) + " secs";
   //    if (s < 300) return Math.floor(s / 60) + " mins " + Math.ceil(s % 60) + " secs";
   //    if (s < 3600) return Math.ceil(s / 60) + " mins";
   //    if (s < 18000) return Math.floor(s / 3600) + " hours " + (Math.ceil(s / 60) % 60) + " mins";
   //    if (s < 86400) return Math.ceil(s / 3600) + " hours";
   //    return Math.ceil(s / 86400) + " days";
   // },

   counter_tmp: 0,

   flashing: (count, outText) => {
      count = count || 4;
      return Array((++App.counter_tmp % count) + 1).join(outText || '.');;
   },

   genNotification: (item) => {
      if (item && item.state && item.state.previous === 'in_progress') {
         let msg, audioNotification;

         switch (item.state.current) {
            case 'complete':
               msg = i18n("noti_download_complete");
               audioNotification = new Audio('/audio/complete.ogg');
               // audioNotification = '/audio/complete.ogg';
               break;

            case 'interrupted':
               if (item.error.current === 'USER_CANCELED') {
                  // msg = i18n("noti_download_canceled");
               } else {
                  msg = i18n("noti_download_interrupted");
                  audioNotification = new Audio('/audio/interrupted.ogg');
               }
               break;

               // case 'in_progress':
               //    return false;

            default:
               return false;
         }

         if (msg)
            chrome.downloads.search({
               id: item.id
            }, function (downloads) {
               let download = downloads[0];
               let timeLong = Date.parse(download.endTime) - Date.parse(download.startTime);
               let fileName = App.getFileNameFromPatch(download.filename);
               let minimum_download_time = 3000; // ms

               // skip notifity small file or small size
               if (download.fileSize <= 1 || timeLong < minimum_download_time) return false;

               // console.log('timeLong %s', timeLong);
               // console.log('download.fileSize %s', download.fileSize);
               App.log('Done get download\n%s', JSON.stringify(download));

               if (fileName && fileName.length > 50) {
                  fileName = fileName.slice(0, 31) + "...";
               }

               App.browser.notification.show({
                  title: i18n("noti_download_title") + ' ' + msg,
                  body: fileName
               }, audioNotification && App.sessionSettings["soundNotification"] ? audioNotification : false);
            });
      }
   },

   browser: {
      openTab: (url) => {
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

         clear: () => {
            const manifest = chrome.runtime.getManifest();
            App.browser.toolbar.setIcon({
               path: manifest.icons['16']
            });
            App.browser.toolbar.setBadgeText('');
            App.browser.toolbar.setTitle(i18n("app_title"));
         },
      },

      notification: {
         show: (opt, audioPatch) => {
            const manifest = chrome.runtime.getManifest();

            // web api
            if (window.Notification && Notification.permission === "granted") {
               let notification = new Notification(opt.title || i18n("app_name"), {
                  body: opt.body || '',
                  icon: opt.iconUrl || manifest.icons['48'],
               });

            // chrome api
            } else {
               chrome.notifications.create('info', {
                  type: opt.type || 'basic', //'basic', 'image', 'list', 'progress'
                  title: opt.title || i18n("app_name"),
                  iconUrl: opt.iconUrl || manifest.icons['48'],
                  message: opt.body || '',
                  // "priority": 2,
               }, function (notificationId) {
                  chrome.notifications.onClicked.addListener(function (callback) {
                     chrome.notifications.clear(notificationId, callback);
                  });
               });
            }
            // audio
            if (audioPatch) audioPatch.play();
         },
      }
   },

   // Saves/Load options to localStorage/chromeSync.
   confStorage: {
      load: () => {
         let callback = (res) => {
            App.log('confStorage %s', JSON.stringify(res));
            App.sessionSettings = res;

            App.refresh();
         };
         // load store settings
         Storage.getParams(null /*all*/ , callback, true /* true=sync, false=local */ );
      },
      // load: () => {
      //    chrome.storage.sync.get(null, function (options) {
      //       App.log('confStorage', JSON.stringify(options));
      //       App.sessionSettings = options;
      //       App.refresh();
      //    });
      // },
   },

   // Register the event handlers.
   eventListener: () => {
      chrome.downloads.onCreated.addListener(function (item) {
         App.log('downloads.onCreated');
         let shelf = App.sessionSettings.shelfEnabled ||
            App.sessionSettings.ShowDownBar ? true : false; // fix old ver-conf/ TODO remove
         chrome.downloads.setShelfEnabled(shelf);
      });

      chrome.downloads.onChanged.addListener(function (item) {
         App.log('downloads.onChanged');
         App.log('onChanged item %s', JSON.stringify(item));
         App.refresh(item);
      });

      // called when the icon is clicked
      chrome.browserAction.onClicked.addListener(function (tab) {
         App.browser.openTab('chrome://downloads/');
      });

      chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
         switch (request.action) {
            // case 'getOptions':
            //   let defaults = {};
            //   let resp = {};
            //   for (const key in defaults) {
            //       if (!(key in localStorage)) {
            //           localStorage[key] = defaults[key];
            //       }
            //       resp[key] = localStorage[key];
            //   }
            //   sendResponse(resp);
            // break;
            case 'setOptions':
               App.sessionSettings = request.options;
               App.browser.toolbar.clear();
               break;
         }
      });

      // single_file_done.addEventListener("ended", checkDownloadStack);
   },

   refresh: (item) => {
      App.getDownloadProgress(App.pulsar);
      if (App.sessionSettings["showNotification"]) {
         App.genNotification(item);
      }
   },

   init: () => {
      App.confStorage.load();
      App.eventListener();
      App.browser.toolbar.clear();
   },

   log: (msg, arg) => {
      if (App.DEBUG) {
         if (arg) msg = msg.replace(/%s/g, arg.toString().trim());
         console.log('[+] ' + msg);
      }
   },
}

App.init();

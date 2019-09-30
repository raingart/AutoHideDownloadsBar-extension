// 'use strict';

console.log(i18n("app_name") + ": init background.js");

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
      dataForDrawing.outText = flashing(progress);
      dataForDrawing.color_text = 'red';

   } else if (progress === Infinity) {
      dataForDrawing.outText = flashing();
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

function flashing(outText) {
   let loadingSymbol = outText ? outText.toString().split() : ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
   App.circleNum = App.circleNum < loadingSymbol.length - 1 ? ++App.circleNum : 0;
   return loadingSymbol[App.circleNum];
}

function notificationCheck(item) {
   if (item && item.state && item.state.previous === 'in_progress') {
      let notiData = {},
         audioNotification;

      switch (item.state.current) {
         case 'complete':
            notiData.title = i18n("noti_download_complete");
            audioNotification = '/audio/complete.ogg';
            break;

         case 'interrupted':
            if (item.error.current == 'USER_CANCELED') {
               // notiData.title = i18n("noti_download_canceled");
            } else {
               notiData.title = i18n("noti_download_interrupted");
               notiData.requireInteraction = true; //cancel automatically closing
               notiData.icon = '/icons/dead.png';
               audioNotification = '/audio/interrupted.ogg';
            }
            break;

         // case 'in_progress':
         //    return;

         default:
            return;
      }

      if (Object.keys(notiData).length) {
         chrome.downloads.search({ id: item.id }, downloads => {
            let download = downloads[0];
            let timeLong = Date.parse(download.endTime) - Date.parse(download.startTime);
            let fileName = getFileNameFromPatch(download.filename);
            let minimum_download_time = 3000; // ms

            // skip notifity small file or small size
            if (download.fileSize <= 1 || timeLong < minimum_download_time) return;

            // App.log('timeLong %s', timeLong);
            // App.log('download.fileSize %s', download.fileSize);
            App.log('Done get download\n%s', JSON.stringify(download));

            notiData.title = `${i18n("noti_download_title")} ${notiData.title}`;
            notiData.body = fileName.toString().slice(0, 31) + "...";
            notiData.downloadId = item.id;
            notificationCreate(notiData, audioNotification && App.sessionSettings["soundNotification"] ? audioNotification : false);
         });
      }
   }

   function notificationCreate(options, audioPatch) {
      if (window.Notification && Notification.permission === "granted") {
         notification_show();
      } else {
         Notification.requestPermission().then(() => notification_show());
      }

      function notification_show() {
         const manifest = chrome.runtime.getManifest();
         new Notification(options.title || i18n("app_name"), {
            body: options.body || '',
            icon: options.icon || manifest.icons['48']
         }).onclick = () => this.close();

         // audio alert
         if (audioPatch) new Audio(audioPatch).play();
      }
   }

   // BUG in broken file open buttons!
   // function notificationCreate(options, audioPatch) {
   //    if (window.Notification && Notification.permission === "granted") {
   //       notification_show();
   //    } else {
   //       Notification.requestPermission().then(() => notification_show());
   //    }

   //    function notification_show() {
   //       const manifest = chrome.runtime.getManifest();
   //       let notiID;

   //       let notiBody = {
   //          type: "basic",
   //          iconUrl: options.icon || manifest.icons['48'],
   //          title: options.title || i18n("app_name"),
   //          message: options.body || '',
   //          // contextMessage: "contextMessage",
   //       }

   //       let permissionsObj = {
   //          permissions: ['downloads.open']
   //       }
   //       chrome.permissions.contains(permissionsObj, granted => {
   //          chrome.permissions.request(permissionsObj, granted => {
   //             notiBody.buttons = [{
   //                title: "open file",
   //                // iconUrl: "/path/to/yesIcon.png"
   //             }, {
   //                title: "open folder",
   //                // iconUrl: "/path/to/yesIcon.png"
   //             }];
   //          });
   //       });

   //       chrome.notifications.create('', notiBody, id => {
   //          notiID = id;
   //          // audio alert
   //          if (audioPatch) new Audio(audioPatch).play();
   //       });

   //       chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
   //          console.log("onButtonClicked", notiID, notificationId, buttonIndex);
   //          if (notificationId === notiID) {
   //             console.log("button clicked", buttonIndex);
   //             switch (buttonIndex) {
   //                case 0:
   //                   chrome.downloads.open(notificationId);
   //                   break;
   //                case 1:
   //                   chrome.downloads.show(notificationId);
   //                   break;

   //                default:
   //                   console.warn('dont have button onlick action:', buttonIndex)
   //             }
   //             // chrome.notifications.clear(notificationId, function () {});
   //          }
   //       });
   //    }
   // }
}

function getDownloadProgress() {
   let searchObj = {
      state: 'in_progress',
      paused: false,
      orderBy: ['-startTime']
   }

   chrome.downloads.search(searchObj, downloads => {
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
         if (download.mime === "application/x-chrome-extension") continue;

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
         if (download.danger != "safe" && totalReceived === fileSize) return '!';
      };

      if (countActive) {
         // set toolbar title
         let titleOut = '';

         // size
         titleOut += bytesToSize(totalReceived) + " / ";
         titleOut += totalSize ? bytesToSize(totalSize) : "unknown size";

         if (totalSize) {
            // pt
            titleOut += "\n" + progress + "%";
            // left time
            titleOut += " ~" + formatTimeLeft(timeLeft) + " left";
         }

         // count
         if (countActive > 1 || countInfinity) {
            titleOut += "\n" + 'active: ' + countActive;
            // let badgeText = countInfinity ? countInfinity + '/' + countActive : countActive
            // BrowserAct.badge.set.text(badgeText);

            // ignored
            if (countInfinity) {
               if (countInfinity === countActive) {
                  totalSize = false;
                  progress = Infinity;
               } else {
                  titleOut += ' | ignore: ' + countInfinity;
               }
            }
         }

         BrowserAct.badge.set.title(titleOut);

      } else {
         // if ((item.state.current == 'complete') && item.endTime && !item.error) {
         // hide shelf-panel
         App.shelfTimeout = setTimeout(function () {
            App.log('setShelfEnabled');
            chrome.downloads.setShelfEnabled(false);
         }, Number(App.sessionSettings["shelfTimeout"]) * 1000 || 0);
         // }
      }

      App.log('countActive %s', countActive);
      App.log('progress %s', progress);

      return progress;
   });
}


const App = {

   // DEBUG: true,

   pulsar: statusDownload => {
      App.log('pulsar: %s', statusDownload);

      if (statusDownload && !App.isBusy) {
         App.log('setInterval');
         App.isBusy = true;
         App.temploadingMessage = setInterval(function () {
            App.log('setInterval RUN');
            App.updateIndicate(getDownloadProgress());
         }, 800);
         // cancellation of pending shelf-panel hiding
         App.shelfTimeout && clearTimeout(App.shelfTimeout);

      } else if (!statusDownload && App.isBusy) {
         App.log('clearInterval');
         App.isBusy = false;
         clearInterval(App.temploadingMessage);
         BrowserAct.badge.clear();

      } else App.log('pulsar ignore');
   },

   updateIndicate: pt => {
      if (App.sessionSettings['typeIconInfo'] != 'false')
         BrowserAct.badge.set.icon({ 'imageData': drawToolbarIcon(dataForDrawing(pt)) });
   },

   // Saves/Load options to localStorage/chromeSync.
   storage: {
      load: () => {
         const callback = res => {
            App.log('storage %s', JSON.stringify(res));
            App.sessionSettings = res;

            App.updateBrowserBadgeAction();
         };
         // load store settings
         Storage.getParams(callback, 'sync');
      }
   },

   // Register the event handlers.
   eventListener: () => {
      chrome.downloads.onCreated.addListener(item => {
         chrome.downloads.setShelfEnabled(App.sessionSettings.shelfEnabled ? true : false);
      });

      chrome.downloads.onChanged.addListener(item => App.refresh(item));

      chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
         switch (request.action) {
            case 'setOptions':
               App.sessionSettings = request.options;
               BrowserAct.badge.clear();
               App.updateBrowserBadgeAction();
               break;
         }
      });
   },

   refresh: item => {
      let info = getDownloadProgress();
      info && App.pulsar(info);
      if (item && App.sessionSettings["showNotification"]) notificationCheck(item);
   },

   openTab_chrome_downloads: tab => BrowserAct.tab.open('chrome://downloads/'),
   openTab_download_default_folder: () => chrome.downloads.showDefaultFolder(),

   updateBrowserBadgeAction: () => {
      const clearListener = act => {chrome.browserAction.onClicked.hasListener(act) && chrome.browserAction.onClicked.removeListener(act)};

      // // clear browserAction
      clearListener(App.openTab_download_default_folder);
      clearListener(App.openTab_chrome_downloads);
      chrome.browserAction.setPopup({ popup: '' });

      // called when the icon is clicked
      switch (App.sessionSettings["toolbarBehavior"]) {
         case 'popup':
            chrome.browserAction.setPopup({ 'popup': '/html/popup.html' });
            break;

         case 'download_default_folder':
            if (!chrome.browserAction.onClicked.hasListener(App.openTab_download_default_folder)) {
               chrome.browserAction.onClicked.addListener(App.openTab_download_default_folder);
            }
            break;

         // case 'chrome_downloads':
         default:
            if (!chrome.browserAction.onClicked.hasListener(App.openTab_chrome_downloads)) {
               chrome.browserAction.onClicked.addListener(App.openTab_chrome_downloads);
            }
            break;
      }
   },

   init: () => {
      App.storage.load();
      App.eventListener();
      BrowserAct.badge.clear();
   },

   log: function (msg) {
      if (this.DEBUG) {
         for (let i = 1; i < arguments.length; i++) {
            msg = msg.replace(/%s/, arguments[i].toString().trim());
         }
         console.log('[+] %s', msg);
      }
   },
}

App.init();

// 'use strict';

var i = 0;

const App = {

   debug: true,

   signal: {
      downloadCreated: function () {
         App.log('downloadCreated init');

         var isShowPanel = App.tempSaveStorage["ShowDownBar"] || false;
         chrome.downloads.setShelfEnabled(isShowPanel);
      },

      downloadChanged: function () {
         App.log('downloadChanged init');

         App.clearS();
         App.getDownloadProgress(App.singer);

      },
   },

   singer: function (status) {
      App.log('setInterval', status);

      if (App.temploadingMessage && !status) {
         clearInterval(App.temploadingMessage);
      } else {
         App.temploadingMessage = setInterval(function () {
            App.getDownloadProgress(App.showProgress);
         }, 300);
      }
   },

   clearS: function () {
      var manifest = chrome.runtime.getManifest();

      chrome.browserAction.setIcon({
         path: manifest.icons['16']
      });
      chrome.browserAction.setBadgeText({
         text: ''
      });
   },

   showProgress: function (progressRatio) {

      if ( !App.tempSaveStorage['HideIconInfo'] ) {

         var options = {
            'color': {
               'startingHue': 0,
               'endingHue': 120,
               'saturation': 100,
               'lightness': 50
            }
         }

         var percentageToHsl = function (percentage, fromHue, toHue) {
            var hue = Math.round((percentage * (toHue - fromHue)) + fromHue);
            return 'hsla(' + hue + ', ' + options.color.saturation + '%, ' + options.color.lightness + '%, 0.8)';
         }

         var color = percentageToHsl(1, options.color.startingHue, options.color.endingHue);
         // var color = percentageToHsl((progressRatio * 3.6), options.color.startingHue, options.color.endingHue);

         var dataForDrawing = {
            'color': color,
            'progressRatio': progressRatio || 0,
            // 'outText': Math.round(100 - (progressRatio * 100)),
            'outText': Number.isInteger(progressRatio) ? Math.round(progressRatio * 100) : Array((++i % 4) + 1).join("."),
            // 'outText': Math.round(progressRatio * 100),
         }
         App.log('dataForDrawing ', JSON.stringify(dataForDrawing));

         App.draw(dataForDrawing);

      } else {

         if (Number.isInteger(progressRatio)) {  
            var progressPercent = Math.round(progressRatio * 100) + '%';
            
         } else {
            var loadingSymbol = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            App.circleNum = App.circleNum < loadingSymbol.length - 1 ? ++App.circleNum : 0;
            var progressPercent = loadingSymbol[App.circleNum];
         }

         chrome.browserAction.setBadgeBackgroundColor({
            color: "black"
         });
         chrome.browserAction.setBadgeText({
            text: progressPercent.toString() || 'err'
         });
      }

   },

   draw: function (dataForDrawing) {
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
      context.fillText(dataForDrawing.outText, 8, 8);

      chrome.browserAction.setIcon({
         imageData: context.getImageData(0, 0, 16, 16)
      });
   },

   getDownloadProgress: function (callback) {

      chrome.downloads.search({}, function (items) {

         var totalSize = 0,
            totalReceived = 0,
            progressRatio = 0,
            countActive = 0;

         for (var item of items) {
            // App.log('item: '+JSON.stringify(item));

            // skip paused
            if (item.paused) {
               App.log('item.paused');
               continue;
            }

            // The download state.
            switch (item.state) {
               // The download completed successfully.
               case 'complete':
                  if ((item.state.current == 'complete') && item.endTime && !item.error)
                     console.warn(item.error);
                  else
                     App.log('done');
                  break;

                  // The download is currently receiving data from the server.
               case 'in_progress':
                  // App.log('item: '+JSON.stringify(item));
                  // App.info('in_progress');
                  countActive = ++countActive;

                  totalSize += item.fileSize || item.totalBytes
                  totalReceived += item.bytesReceived;
                  progressRatio = (totalReceived / totalSize).toFixed(2);
                  break;

                  // An error broke the connection with the file host.
                  // case 'interrupted':
                  //    App.info('interrupted');
                  //    break;
            }

            if (App.tempSaveStorage["ShowLastProgress"] && count === 1) {
               App.log('ShowLastProgress: ', App.tempSaveStorage["ShowLastProgress"]);
               break;
            }

         };

         if (countActive <= 0) {
            chrome.downloads.setShelfEnabled( false );
            App.singer(false);
         }

         App.log('countActive ', countActive);
         App.log('percent ', progressRatio);

         if (callback && typeof (callback) === "function") {
            return callback(progressRatio);
         }

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
            App.log('res', JSON.stringify(res));
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
      if (App.debug) console.log('[+] ' + msg.toString() +' '+ arg1 || '')
   },
}


App.init();

// Register the event handlers.
chrome.downloads.onCreated.addListener(function (item) {
   App.signal.downloadCreated();
});

chrome.downloads.onChanged.addListener(function (item) {
   App.signal.downloadChanged();
});

// called when the icon is clicked
chrome.browserAction.onClicked.addListener(function (tab) {
   App.openTab('chrome://downloads/');
   // App.signal.downloadCreated();
   // App.signal.downloadChanged();
});

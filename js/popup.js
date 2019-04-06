const App = {

   // DEBUG: true,

   list: {
      update: (item, li, isNew) => {
         App.log('update: ', item.id);
         li.setAttribute("state", item.state);

         let progressBar = li.querySelector('.progress');
         let controlDiv = li.querySelector('.control');
         let statusDiv = li.querySelector('.status');

         if (statusDiv.textContent != item.state) {
            statusDiv.textContent = item.state;
         }

         if (item.state != 'in_progress') {
            var fileLink = li.querySelector('.info a');
            fileLink.id = item.id;

            if (progressBar) {// clear progressBar
               progressBar.parentNode.removeChild(progressBar);
            }

            chrome.downloads.getFileIcon(
               item.id, {
                  'size': 32
               }, icon_url => {
                  // icon
                  controlDiv.innerHTML = '';
                  controlDiv.appendChild((() => {
                     let a = document.createElement("a");
                     a.id = item.id;
                     // a.setAttribute('act2', 'erase');
                     a.title = 'right click - remove from history';
                     // a.setAttribute('tooltip', 'right click - remove from history');
                     // a.setAttribute("flow", 'right');
                     a.innerHTML = '<img src="' + icon_url + '" class="icon" />'
                     return a;
                  })());
               });
         }

         switch (item.state) {
            case 'complete':
               if (item.exists) {
                  fileLink.href = '#';
                  // fileLink.setAttribute("tooltip", 'left click - open / right - show');
                  fileLink.title = 'left click - open / right - show';

               } else {
                  statusDiv.textContent = 'deleted';
               }
               break;

            case 'in_progress':
               const timeLeftMS = (new Date(item.estimatedEndTime) - new Date());
               const timeLeft = formatTimeLeft(timeLeftMS);
               const pt = Math.floor(100 * item.bytesReceived / item.fileSize);
               const receivedSize = formatBytes(item.bytesReceived);
               const totalSize = item.fileSize ? formatBytes(item.fileSize) : 'unknown';
               // const filePatch = getFileNameFromPatch(item.filename || item.url);
               const sizeLeftBytes = item.totalBytes - item.bytesReceived;
               const speed = formatSpeed(timeLeftMS, sizeLeftBytes);

               let button = controlDiv.querySelector('button');
               if (!button) {
                  App.log('create controlDiv [%s] > button', item.id);
                  button = document.createElement("button");
                  button.id = item.id;
                  button.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\
                  <defs>\
                     <path id="ytp-12" d="M 11 10 L 17 10 L 17 26 L 11 26 M 20 10 L 26 10 L 26 26 L 20 26">\
                        <animate begin="indefinite" attributeType="XML" attributeName="d" fill="freeze" from="M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26" to="M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28" dur="0.1s" keySplines=".4 0 1 1" repeatCount="1"></animate>\
                     </path>\
                  </defs>\
                  <use xlink:href="#ytp-12" class="ytp-svg-shadow"></use>\
                  <use xlink:href="#ytp-12" class="ytp-svg-fill"></use>\
               </svg>';
                  // let animate = button.querySelector('animate');
                  // animate.beginElement();
                  controlDiv.appendChild(button);
               }
               button.setAttribute("act", (item.paused && item.canResume) ? 'resume' : 'pause');
               // button.setAttribute("tooltip", "right click - cancel");
               // button.setAttribute("flow", 'right');
               button.title = 'right click - cancel';

               // animation
               // button.textContent = (item.paused && item.canResume) ? '▶' : '▮▮';
               let pause = "M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28";
               let play = "M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26";
               let animate = button.querySelector('animate');
               let animateStatus = animate.getAttribute("to");

               animate.setAttribute("from", (item.paused && item.canResume) ? play : pause);
               animate.setAttribute("to", (item.paused && item.canResume) ? pause : play);

               if (isNew || animateStatus != animate.getAttribute("to")) {
                  App.log('animation', item.id, (item.paused && item.canResume) ? '▶' : '▮▮');
                  animate.beginElement();
               }

               // create progressBar
               if (!progressBar) {
                  App.log('create progressBar [%s]', item.id);
                  li.appendChild((() => {
                     progressBar = document.createElement("div");
                     progressBar.className = "progress";
                     progressBar.setAttribute('flow', 'down');
                     return progressBar;
                  })());
               }
               progressBar.setAttribute('tooltip', pt + '%');
               progressBar.style.background = 'linear-gradient(to right, #00bfffd0 ' + (pt - 1) + '%, #ffffff ' + pt + '%)';

               statusDiv.textContent = receivedSize + ' of ' + totalSize;
               if (timeLeft) statusDiv.textContent += ' - ' + timeLeft;
               if (speed) statusDiv.textContent += ' [' + speed + ']';
               break;

            case 'interrupted':
               if (item.error == 'NETWORK_FAILED') {
                  fileLink.href = item.url;
                  fileLink.title = 'open file url';
                  // fileLink.setAttribute('tooltip', 'open file url');
                  fileLink.target = "_blank";
                  fileLink.style.color = '#ff0000b3';

               } else if (item.error == 'USER_CANCELED') {
                  li.parentNode.removeChild(li);
               }
               break;
         }
      },

      create: item => {
         App.log('create: ', item.id);

         let li = (() => {
            let li = document.createElement("li");
            li.className = "item";
            li.id = 'id-' + item.id;
            return li;
         })();

         // controlDiv
         li.appendChild((() => {
            let controlDiv = document.createElement("div");
            controlDiv.className = "control";
            return controlDiv;
         })());

         // infoDiv
         li.appendChild((() => {
            const filePatch = getFileNameFromPatch(item.filename || item.url);

            let infoDiv = document.createElement("div");
            infoDiv.className = "info";

            // fileLink
            infoDiv.appendChild((() => {
               let fileLink = document.createElement("a");
               fileLink.textContent = filePatch;
               fileLink.setAttribute("flow", 'up');
               return fileLink;
            })())

            // statusDiv
            infoDiv.appendChild((() => {
               let statusDiv = document.createElement("div");
               statusDiv.className = "status";
               statusDiv.textContent = item.state;
               return statusDiv;
            })());

            return infoDiv;
         })());

         return li;
      }
   },

   generateList: item => {
      // skip crx
      if (item.mime == "application/x-chrome-extension") return;

      let li = App.UI.containerDownload.querySelector('li#id-' + item.id);

      if (li) {
         // if (!item.paused)
         if (item.state == 'in_progress' || li.getAttribute('state') != item.state) {
            App.list.update(item, li);
         }

      } else {
         //skip canceled
         if (item.hasOwnProperty("error") && item.error == "USER_CANCELED") return;
         li = App.list.create(item);
         App.UI.containerDownload.appendChild(li);
         App.list.update(item, li, 'new');
      }
   },

   refresh: () => {
      let searchObj = {
         // state: 'in_progress',
         // paused: false,
         orderBy: ['-startTime']
         // orderBy: ['-endTime']
      }

      chrome.downloads.search(searchObj, downloads => {
         if (searchObj.hasOwnProperty('state')) {
            App.UI.containerDownload.textContent = '';
         }

         if (downloads.length) {
            App.UI.info.textContent = 'initilization...';
            downloads.forEach(download => App.generateList(download));
            App.UI.info.textContent = '';

            // open file/show
            singleClick_addEventListener(
               App.UI.containerDownload.querySelectorAll("li[state=complete] .info a[href]"), 'open', 'show');

            // file cancel
            singleClick_addEventListener(
               App.UI.containerDownload.querySelectorAll(".control button[id]"), null, 'cancel');

            // file erase
            singleClick_addEventListener(
               App.UI.containerDownload.querySelectorAll(".control a"), null, 'erase');

         } else {
            App.UI.info.textContent = 'no active downloads';
         }

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

      clear: () => {
         const manifest = chrome.runtime.getManifest();
         App.toolbar.setIcon({
            path: manifest.icons['16']
         });
         App.toolbar.setBadgeText('');
         App.toolbar.setTitle(i18n("app_title"));
      },
   },

   // Saves/Load options to localStorage/chromeSync.
   storage: {
      load: () => {
         let callback = res => {
            App.log('storage %s', JSON.stringify(res));
            App.sessionSettings = res;
         };
         // load store settings
         Storage.getParams(callback, 'sync');
      },
      // load: () => {
      //    chrome.storage.sync.get(null, function (options) {
      //       App.log('storage %s', JSON.stringify(options));
      //       App.sessionSettings = options;
      //       App.refresh();
      //    });
      // },
   },

   init: () => {
      App.storage.load();
      App.pulsar = setInterval(function () {
         App.log('setInterval RUN');
         if (App.sessionSettings && Object.keys(App.sessionSettings).length) {
            App.refresh();
         }
      }, 500);
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


window.addEventListener('load', event => {
   App.UI = {
      containerDownload: document.getElementById('containerDownload'),
      search: document.getElementById('search'),
      info: document.getElementById('info'),
      clearAllHistory: document.getElementById('clearAllHistory'),
   };

   // search
   ["change", "keyup"].forEach(event => {
      App.UI.search.addEventListener(event, function (e) {
         // clearInterval(App.pulsar);
         searchFilter(this.value, App.UI.containerDownload.children);
      });
   });

   // bth clear
   App.UI.clearAllHistory.addEventListener("click", function (event) {
      chrome.downloads.erase({
         state: "complete"
      });
   });

   App.init();
});

function singleClick_addEventListener(parent, act1, act2) {
   Array.from(parent).forEach(elementClicked => {
      if (elementClicked.getAttribute('listener') !== 'true') {
         elementClicked.setAttribute('listener', 'true');
         App.log('event has been attached');

         const id = +elementClicked.id.split(/\s+/).pop();
         const callback = () => fileAction(id, act1 || elementClicked.getAttribute("act"));
         const callback2 = () => fileAction(id, act2 || elementClicked.getAttribute("act2"));

         click_addEventListener(elementClicked, callback, callback2);
      }
   })
}

function fileAction(id, act) {
   console.log('fileAction: %s', id, act);
   if (!act) return;
   switch (act.toLowerCase()) {
      case 'open':
         chrome.downloads.open(id);
         break;
      case 'show':
         chrome.downloads.show(id);
         break;
      case 'pause':
         chrome.downloads.pause(id);
         break;
      case 'resume':
         chrome.downloads.resume(id);
         break;
      case 'cancel':
         chrome.downloads.cancel(id);
      case 'erase':
         chrome.downloads.erase({
            'id': id
         }, rm_id => {});
         break;
      default:
         console.warn("don't has", act);
   }
}

chrome.downloads.onErased.addListener(function (id) {
   console.log('onErased', id);
   document.getElementById('id-' + id).classList.add("erase");
})

chrome.downloads.onCreated.addListener(function (item) {
   App.log('downloads.onCreated %s', JSON.stringify(item));
   // App.browser.toolbar.setIcon({
   //    imageData: App.genProgressBar.grafic(pt)
   // });
   App.toolbar.setBadgeText('new');
   setTimeout(function () {
      App.toolbar.setBadgeText();
   }, 2000);
});

chrome.downloads.onChanged.addListener(function (item) {
   App.log('downloads.onChanged %s', JSON.stringify(item));

   // setTimeout(function () {
   //    document.getElementById('id-' + item.id).querySelector('button animate').beginElement();
   // }, 200);

   App.toolbar.setBadgeText('up');
   setTimeout(function () {
      App.toolbar.setBadgeText();
   }, 1000);
});

function listUpdate(item, li, isNew) {
   App.log('update: %s', item.id);
   li.setAttribute("state", item.exists ? item.state : 'deleted');

   let progressBar = li.querySelector('.progress');
   let controlDiv = li.querySelector('.control');
   let statusDiv = li.querySelector('.status');

   if (item.state != 'in_progress') {
      if (statusDiv.textContent != item.state) {
         statusDiv.textContent = item.state;
      }

      var fileLink = li.querySelector('a.link');
      fileLink.id = item.id;
      fileLink.title = 'open file url in new tab';
      fileLink.target = "_blank";

      if (progressBar) { // clear progressBar
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
               a.title = 'right click: remove from history';
               // a.setAttribute('tooltip', 'right click - remove from history');
               // a.setAttribute("flow", 'right');
               a.innerHTML = '<img src="' + icon_url + '" class="icon" />'

               // add shake animate
               a.addEventListener('click', e => {
                  const className = 'shake-animate';
                  a.classList.add(className);
                  a.addEventListener('animationend', () => a.classList.remove(className));
               });
               return a;
            })());
         });
   }

   switch (item.state) {
      case 'complete':
         if (item.exists) {
            // fileLink.href = '#';
            // fileLink.setAttribute("tooltip", 'left click - open / right - show');
            fileLink.title = 'click left: open / click right: show';
            statusDiv.textContent += ' [' + bytesToSize(item.fileSize) + ']';

         } else {
            // fileLink.href = item.url;
            statusDiv.textContent = 'deleted';
         }
         break;

      case 'in_progress':
         const timeLeftMS = (new Date(item.estimatedEndTime) - new Date());
         const timeLeft = formatTimeLeft(timeLeftMS);
         const pt = Math.floor(100 * item.bytesReceived / item.fileSize);
         const receivedSize = bytesToSize(item.bytesReceived);
         const totalSize = item.fileSize ? bytesToSize(item.fileSize) : 'unknown';
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
            // button.title = 'right click - cancel';
            button.setAttribute("tooltip", "right click: stop+delete");
            button.setAttribute("flow", 'right');
            // let animate = button.querySelector('animate');
            // animate.beginElement();
            controlDiv.appendChild(button);
         }
         button.setAttribute("act", (item.paused && item.canResume) ? 'resume' : 'pause');

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

         if (progressBar.getAttribute('tooltip') != (pt + '%')) {
            progressBar.setAttribute('tooltip', pt + '%');
            progressBar.style.background = 'linear-gradient(to right, #00bfffd0 ' + (pt - 1) + '%, #ffffff ' + pt + '%)';
         }
         statusDiv.textContent = receivedSize + '/' + totalSize;
         if (timeLeft) statusDiv.textContent += ' - ' + timeLeft;
         if (speed) statusDiv.textContent += ' (' + speed + ')';

         break;

      case 'interrupted':
         if (item.error == 'NETWORK_FAILED') {
            // fileLink.href = item.url;
            // fileLink.title = 'open file url';
            // fileLink.setAttribute('tooltip', 'open file url');
            fileLink.target = "_blank";
            fileLink.style.color = '#ff0000b3';

         } else if (item.error == 'USER_CANCELED') {
            // li.parentNode.removeChild(li);
         }
         break;
   }
}

function listCreate(item) {
   App.log('create: %s', item.id);

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

   // fileLink
   li.appendChild((() => {
      const filePatch = getFileNameFromPatch(item.filename || item.url);
      let fileLink = document.createElement("a");
      fileLink.className = "link";
      fileLink.href = item.url;
      fileLink.textContent = filePatch;
      fileLink.setAttribute("flow", 'up');
      return fileLink;
   })());

   // statusDiv
   li.appendChild((() => {
      let statusDiv = document.createElement("div");
      statusDiv.className = "status";
      statusDiv.textContent = (item.exists ? item.state : 'deleted');
      return statusDiv;
   })());

   return li;
}

const App = {

   // DEBUG: true,

   generateList: item => {
      // skip crx
      if (item.mime == "application/x-chrome-extension") return;

      let li = App.UI.containerDownload.querySelector('li#id-' + item.id);

      if (li) {
         // if (!item.paused)
         if (item.state == 'in_progress' || li.getAttribute('state') != (item.exists ? item.state : 'deleted')) {
            listUpdate(item, li);
         }

      } else {
         //skip canceled
         // if (item.hasOwnProperty("error") && item.error == "USER_CANCELED") return;
         li = listCreate(item);
         App.UI.containerDownload.appendChild(li);
         listUpdate(item, li, 'new');
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

         // filtering not canceled
         const data = downloads.filter(item => !(item.hasOwnProperty("error") && item.error == "USER_CANCELED"));

         if (data.length) {
            // App.UI.info.textContent = 'Initilization...';

            data.forEach(download => App.generateList(download));

            App.UI.info.textContent = '';

            // open file/show
            singleClick_addEventListener(
               App.UI.containerDownload.querySelectorAll("[state=complete] a.link[href][id]"), 'open', 'show');

            // file cancel
            singleClick_addEventListener(
               App.UI.containerDownload.querySelectorAll(".control button[id]"), null, 'cancel');

            // file erase
            singleClick_addEventListener(
               App.UI.containerDownload.querySelectorAll(".control a[id]"), null, 'erase');

         } else {
            App.UI.info.textContent = 'no active downloads';
         }

      });
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
   },

   init: () => {
      App.storage.load();
      App.pulsar = setInterval(() => {
         if (App.sessionSettings && Object.keys(App.sessionSettings).length) {
            App.refresh();
         }
      }, 600);
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
      showDefaultTab: document.getElementById('showDefaultTab'),
   };

   // search
   ["change", "keyup"].forEach(event => {
      App.UI.search.addEventListener(event, function (e) {
         searchFilter(this.value, App.UI.containerDownload.children);
      });
   });

   // bth clear
   App.UI.clearAllHistory.addEventListener("click", function (e) {
      chrome.downloads.erase({
         state: "complete"
      });
      // document.querySelectorAll('li[id^="id"]').forEach(a => a.classList.add("erase")); // test animations
   });

   App.UI.showDefaultTab.addEventListener("click", function (e) {
      e.preventDefault();
      BrowserAct.tab.open('chrome://downloads/')
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
         }, rm_id => { });
         // document.getElementById('id-' + id).classList.add("erase"); // test animations
         break;
      default:
         console.warn("don't has", act);
   }
}

chrome.downloads.onErased.addListener(function (id) {
   console.log('onErased', id);
   document.getElementById('id-' + id).classList.add("erase");
})

// chrome.downloads.onChanged.addListener(function (item) {
//    App.log('downloads.onChanged %s', JSON.stringify(item));
//    setTimeout(() => document.getElementById('id-' + item.id).querySelector('button animate').beginElement(), 200);
// });

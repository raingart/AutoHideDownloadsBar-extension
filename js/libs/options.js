console.debug("init options.js");

window.addEventListener('load', (evt) => {

   const Conf = {
      storageMethod: 'local',
      // storageMethod: 'sync',

      attrDependencies() {
         [...document.querySelectorAll("[data-dependent]")]
            .forEach(dependentItem => {
               // let dependentsList = dependentItem.getAttribute('data-dependent').split(',').forEach(i => i.trim());
               const dependentsJson = JSON.parse(dependentItem.getAttribute('data-dependent').toString());
               const handler = () => showOrHide(dependentItem, dependentsJson);
               // init state
               handler();

               const dependentTag = document.getElementById(Object.keys(dependentsJson))
               if (dependentTag) dependentTag.addEventListener("change", handler);
            });

         function showOrHide(dependentItem, dependentsList) {
            for (const name in dependentsList)
               for (const thisVal of dependentsList[name]) {
                  let reqParent = document.getElementsByName(name)[0];
                  if (!reqParent) {
                     console.error('error showOrHide:', name);
                     continue;
                  }

                  if (reqParent.checked && thisVal) {
                     // console.debug('reqParent.checked');
                     dependentItem.classList.remove("hide");

                  } else if (reqParent.value == thisVal) {
                     dependentItem.classList.remove("hide");
                     // console.debug(reqParent.value + '==' + thisVal);
                     break;

                  } else {
                     dependentItem.classList.add("hide");
                     // console.debug(reqParent.value + '!=' + thisVal);
                  }
               }
         }
      },

      // Saves options to localStorage/chromeSync.
      saveOptions(form) {
         let obj = {};

         new FormData(form)
            .forEach((value, key) => {
               // SerializedArray
            if (obj.hasOwnProperty(key)) {
               // adding another val
               obj[key] += ';' + value; // add new
               obj[key] = obj[key].split(';'); // to key = [old, new]

            } else obj[key] = value;
         });

         Storage.setParams(obj, this.storageMethod);

         // notify background page
         chrome.extension.sendMessage({
            "action": 'setOptions',
            "options": obj
         });
      },

      bthSubmitAnimation: {
         outputStatus: document.querySelector("[type=submit]"),

         _process: () => {
            Conf.bthSubmitAnimation.outputStatus.textContent = i18n("opt_bth_save_settings_process");
            Conf.bthSubmitAnimation.outputStatus.setAttribute("disabled", true);
         },

         _defaut: () => {
            setTimeout(function () {
               Conf.bthSubmitAnimation.outputStatus.textContent = i18n("opt_bth_save_settings");
               Conf.bthSubmitAnimation.outputStatus.removeAttribute("disabled");
               Conf.bthSubmitAnimation.outputStatus.classList.remove('unSaved');
            }, 300);
         },
      },

      getPermissions(requested, event) {
         if (Array.isArray(requested) && (event.target.checked || event.target.options)) {
            // Permissions must be requested
            chrome.permissions.contains({
               permissions: requested
            }, granted => {
               chrome.permissions.request({
                  permissions: requested,
               }, granted => {
                  // The callback argument will be true if the user granted the permissions.
                  event.target.checked = granted ? true : false;
                  event.target.selectedIndex = granted ? event.target.selectedIndex : event.target.selectedIndex === 0 ? -1 : 0;
                  Conf.attrDependencies(); //fix trigger
               });
            });
         }
      },

      // Register the event handlers.
      eventListener: (function () {
         [...document.forms]
            .forEach(form => {
               form.addEventListener('submit', function (event) {
                  event.preventDefault();
                  Conf.bthSubmitAnimation._process();
                  Conf.saveOptions(this);
                  Conf.bthSubmitAnimation._defaut();
               });
         });

         document.getElementById('showNotification')
            .addEventListener("change", function (event) {
               // console.debug('event.type:', event.type);
               // Conf.getPermissions(['notifications', 'downloads.open'], event);
               Conf.getPermissions(['notifications'], event);
            });

         document.getElementById('toolbarBehavior')
            .addEventListener("change", function (event) {
               // console.debug('event.type:', event.type);
               switch (this.value) {
                  case 'chrome_downloads':
                     Conf.getPermissions(['tabs'], event);
                     break;
                  // case 'popup':
                  //    Conf.getPermissions(['downloads.open'], event);
                  //    break;
               }
            });
      }()),

      init() {
         Storage.getParams(obj => {
            PopulateForm.fill(obj);
            this.attrDependencies();
            document.querySelector("body").classList.remove("preload");

            // show warn
            chrome.downloads.search({
               state: 'in_progress',
               paused: false
            }, downloads => downloads.length && document.getElementsByClassName('warn')[0].classList.remove("hide"));

            Conf.oggSupport();

            [...document.forms[0].elements]
               .filter(i => i.type == 'checkbox')
               .forEach(i => {
                  i.addEventListener('change', event => {
                     if (!Conf.bthSubmitAnimation.outputStatus.classList.contains('unSaved')) {
                        Conf.bthSubmitAnimation.outputStatus.classList.add('unSaved');
                     }
                  });
               });
         }, this.storageMethod);
      },

      // .ogg does support
      oggSupport: () => {
         if (new Audio().canPlayType('audio/ogg; codecs="vorbis"')) return;

         let inputAudio = document.getElementsByName('soundNotification')[0];
         inputAudio.checked = false;
         inputAudio.disabled = true;
         let warnMsg = 'Your browser does not support the .ogg audio file'
         inputAudio.title = warnMsg;
         inputAudio.parentElement.setAttribute("tooltip", warnMsg);
      }
   }

   Conf.init();
});

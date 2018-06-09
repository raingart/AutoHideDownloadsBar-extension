console.log(i18n("app_name") + ": init options.js");

window.addEventListener('load', (evt) => {

   const Conf = {

      attrDependencies: () => {
         let highlightedItems = document.querySelectorAll("[data-dependent]");

         highlightedItems.forEach(function (dependentItem) {
            // let dependentsList = dependentItem.getAttribute('data-dependent').split(',').map(i => i.trim());
            let dependentsJson = JSON.parse(dependentItem.getAttribute('data-dependent').toString());

            // init state
            showOrHide(dependentItem, dependentsJson);

            let itemTagName = Object.keys(dependentsJson);
            let dependentTag = document.getElementsByName(itemTagName)[0] || document.getElementById(itemTagName);

            dependentTag.addEventListener("change", function () {
               showOrHide(dependentItem, dependentsJson);
            });
         })

         function showOrHide(dependentItem, dependentsList) {
            for (let name in dependentsList)
               for (let thisVal of dependentsList[name]) {
                  let reqParent = document.getElementsByName(name)[0];

                  if (reqParent.checked && thisVal) {
                     // console.log('reqParent.checked');
                     dependentItem.classList.remove("hide");
                  } else if (reqParent.value == thisVal) {
                     dependentItem.classList.remove("hide");
                     // console.log(reqParent.value + '==' + thisVal);
                     break;
                  } else {
                     dependentItem.classList.add("hide");
                     // console.log(reqParent.value + '!=' + thisVal);
                  }
               }
         }
      },

      // Saves options to localStorage/chromeSync.
      saveOptions: (form, callback) => {
         let formData = new FormData(form);
         let newOptions = {};

         // add unchecked checkboxes
         // NOTE broked checkbox fill
         // let inputs = document.getElementsByTagName("input");
         // for (let i in inputs) {
         //    let el = inputs[i];
         //    if (el.type == "checkbox") {
         //       // formData.append(el.name, el.checked ? el.value : false);
         //       formData.append(el.name, el.checked ? true : false);
         //    }
         // }

         for (const [key, value] of formData.entries()) {
            newOptions[key] = value;
            // console.log(key, value);
         }

         Storage.setParams(newOptions, true /* true=sync, false=local */ );

         chrome.extension.sendMessage({
            "name": 'setOptions',
            "options": newOptions
         }, function (resp) {
            if (callback && typeof (callback) === "function") {
               return callback();
            }
         });
      },

      bthSaveAnimation: {
         outputStatus: document.querySelector("button"),

         _process: () => {
            Conf.bthSaveAnimation.outputStatus.innerHTML = i18n("opt_bth_save_settings_process");
            Conf.bthSaveAnimation.outputStatus.classList.add("disabled");
            Conf.bthSaveAnimation.outputStatus.classList.add("in-progress");
         },

         _processed: () => {
            Conf.bthSaveAnimation.outputStatus.innerHTML = i18n("opt_bth_save_settings_processed");
            Conf.bthSaveAnimation.outputStatus.classList.remove("in-progress");
         },

         _defaut: () => {
            setTimeout(function () {
               Conf.bthSaveAnimation._processed();
               Conf.bthSaveAnimation.outputStatus.innerHTML = i18n("opt_bth_save_settings");
               Conf.bthSaveAnimation.outputStatus.classList.remove("disabled");
            }, 300);
         },
      },

      // Register the event handlers.
      eventListener: () => {
         let form = document.forms[0];
         // let form = document.querySelector('form');

         form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            Conf.bthSaveAnimation._process();
            // Conf.saveOptions(this);
            Conf.saveOptions(this, Conf.bthSaveAnimation._processed);
            Conf.bthSaveAnimation._defaut();
         }, false);
      },

      init: () => {
         let callback = (res) => {
            UIr.restoreElmValue(res);
            Conf.attrDependencies();

            // show warn
            chrome.downloads.search({
                  state: 'in_progress',
                  paused: false
               }, (downloads) => downloads.length && document.getElementsByClassName('warn')[0].classList.remove("hide")
            );
         };
         Storage.getParams(null, callback, true /* true=sync, false=local */ );

         Conf.eventListener();
      },
   }

   Conf.init();
});

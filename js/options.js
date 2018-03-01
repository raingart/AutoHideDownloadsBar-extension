console.log(i18n("Conf_name") + ": init settings.js");

window.addEventListener('load', (evt) => {

   const Conf = {
      UI: {
         bthSave: document.getElementById('bth-save-settings'),
         ShowDownBar: document.getElementById("ShowDownBar"),
         typeIconInfo: document.getElementById("typeIconInfo"),
         ShowLastProgress: document.getElementById("ShowLastProgress"),
         colorPicker: document.getElementById("colorPicker"),
         colorPickerText: document.getElementById("colorPickerText"),
         showNotification: document.getElementById("showNotification"),
         listReq: document.getElementsByClassName('typeIconInfo_req'),
         listReq2: document.getElementsByClassName('typeIconInfo_req2'),
      },

      // Saves options to localStorage/chromeSync.
      saveOptions: (saveBth) => {
         saveBth.innerHTML = i18n("opt_bth_save_settings_process");
         saveBth.classList.add("disabled");
         saveBth.classList.add("in-progress");

         var newOptions = {};
         newOptions['ShowDownBar'] = Conf.UI.ShowDownBar.checked ? true : false;
         newOptions['ShowLastProgress'] = Conf.UI.ShowLastProgress.checked ? true : false;
         newOptions['showNotification'] = Conf.UI.showNotification.checked ? true : false;
         newOptions['typeIconInfo'] = Conf.UI.typeIconInfo.value || false;
         newOptions['colorPicker'] = Conf.UI.colorPicker.value || false;
         newOptions['colorPickerText'] = Conf.UI.colorPickerText.value || false;

         var callback = () => {
            setTimeout(function () {
               saveBth.innerHTML = i18n("opt_bth_save_settings_processed");
               saveBth.classList.remove("in-progress");
            }, 100);

            setTimeout(function () {
               saveBth.innerHTML = i18n("opt_bth_save_settings");
               saveBth.classList.remove("disabled");
            }, 300);
         }

         Storage.setParams(newOptions, callback, true /*sync*/ ); // false /*local*/ | true /*sync*/

         chrome.extension.sendMessage({
            "name": 'setOptions',
            "options": newOptions
         }, function (resp) {});
      },

      showOrHide: (equally, list) => {
         for (var item of list) {
            if (equally) {
               item.classList.add("hide");
            } else {
               item.classList.remove("hide");
            }
         }
      },

      init: () => {
         var callback = (res) => {
            UIr.restoreElmValue(res);
            var isHide = Conf.UI.typeIconInfo.value == 'false' ? true : false;
            Conf.showOrHide(isHide, Conf.UI.listReq);
      
            var isHide2 = Conf.UI.typeIconInfo.value != 'svg' ? true : false;
            Conf.showOrHide(isHide2, Conf.UI.listReq2);
         };

         Storage.getParams(null, callback, true /*sync*/ ); // true=sync, false=local 
      },
   }

   Conf.init();

   Conf.UI.bthSave.addEventListener("click", function () {
      Conf.saveOptions(this)
   });

   Conf.UI.colorPicker.addEventListener("change", function () {
      console.log('color', this.value);
   });

   Conf.UI.typeIconInfo.addEventListener("change", function () {
      var isHide = this.value == 'false' ? true : false;
      Conf.showOrHide(isHide, Conf.UI.listReq);

      var isHide2 = this.value != 'svg' ? true : false;
      Conf.showOrHide(isHide2, Conf.UI.listReq2);
   });

   document.getElementById('donate').addEventListener("click", function () {
      const manifest = chrome.runtime.getManifest();
      var payment = '1DbKD1rQXobztpsqx2dPZeMz1nKyRJCm9b';
      // if (window.prompt("BTC payment:", payment))
      var url = 'https://blockchain.info/payment_request?address=' + payment;
      url += '&message=' + encodeURIComponent(manifest.short_name) + '+project';
      window.open(url, '_blank');
   });
});

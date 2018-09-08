const UIr = {
   // DEBUG: true,

   restoreElmValue: function (base) {
      this.log("Load from Storage:", JSON.stringify(base));

      for (var key in base) {
         var val = base[key];
         var el = document.getElementsByName(key)[0] || document.getElementById(key);
         if (el) {
            this.log('>opt ' + key + '[' + el.tagName.toLowerCase() + ']: ' + val);

            switch (el.tagName.toLowerCase()) {
               case 'textarea':
                  el.value = val
                  break;

               case 'select':
                  this.setSelectOption(el, val);
                  break;

               case 'input':
                  this.log('>>opt ' + key + '[' + el.type.toLowerCase() + ']: ' + val);
                  switch (el.type.toLowerCase()) {
                     case 'checkbox':
                        el.checked = val ? true : false; // Check/Uncheck
                        // el.value = val ? true : false; // Check/Uncheck
                        break;
                        
                     default:
                        el.value = val;
                  }
                  break;
            }
         }
      }
   },

   setSelectOption: function (selectObj, val) {
      for (var i in selectObj.children) {
         var option = selectObj.children[i];
         if (option.value === val) {
            option.selected = true;
            break
         }
      }
   },

   log: (msg, arg) => {
      if (UIr.DEBUG) {
         if (arg) msg = msg.replace(/%s/g, arg.toString().trim());
         console.log('[+] ' + msg);
      }
   },
}

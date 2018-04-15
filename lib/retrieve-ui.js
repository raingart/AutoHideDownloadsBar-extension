const UIr = {
   // debug: true,

   restoreElmValue: function (base) {
      this.log("Load from Storage:", JSON.stringify(base));

      for (var key in base) {
         var _val = base[key];
         var el = document.getElementsByName(key)[0] || document.getElementById(key);
         if (el) {
            this.log('>opt ' + key + '[' + el.tagName.toLowerCase() + ']: ' + _val);
            switch (el.tagName.toLowerCase()) {
               case 'textarea':
                  el.value = _val
                  break;
               case 'select':
                  this.setSelectOption(el, _val);
                  break;
               case 'input':
                  this.log('>>opt ' + key + '[' + el.type.toLowerCase() + ']: ' + _val);
                  switch (el.type.toLowerCase()) {
                     case 'checkbox':
                        el.checked = _val ? true : false; // Check/Uncheck
                        // el.value = _val ? true : false; // Check/Uncheck
                        break;
                     default:
                        el.value = _val;
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

   log: function (msg, arg) {
      if (this.debug) console.log('> ' + msg.toString(), arg || '')
   }
}

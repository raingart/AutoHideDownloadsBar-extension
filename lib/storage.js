var Storage = function () {
   return {
      setParams: function (r, o) {
         var e = o ? chrome.storage.sync : chrome.storage.local;
         e.set(r, function () {
            chrome.runtime.lastError && console.log(chrome.runtime.lastError)
         })
      },

      getParams: function (r, o, e) {
         var n = e ? chrome.storage.sync : chrome.storage.local;
         n.get(r, function (r) {
            chrome.runtime.lastError ? console.log(chrome.runtime.lastError) : o(r)
         })
      },

      restoreOptions: function (base) {
         console.log("Load from Storage:", JSON.stringify(base));

         for (var property in base) {
            var item = base[property];
            var el = document.getElementById(property);
            if (el) {
               console.log('opt ' + property + '[' + el.type + ']: ' + item);
               switch (el.tagName.toLowerCase()) {
                  case 'textarea':
                     el.value = item
                     break;
                  case 'options':
                     this.setSelected(el, item);
                     break;
                  case 'input':
                     switch (el.type.toLowerCase()) {
                        case 'checkbox':
                           el.checked = item ? true : false; // Check/Uncheck
                           break;
                     }
                     break;
                     // default:
                     //    obj.style.height = 'auto';
               }
            }
         }
      },

      setSelected: function (selectObj, val) {
         for (var n = 0; n < selectObj.children.length; n++) {
            var option = selectObj.children[n];
            if (option.value === val) {
               option.selected = true;
               break
            }
         }
      },
   }
}();

chrome.storage.onChanged.addListener(function (r, o) {
   for (var e in r) {
      var n = r[e];
      console.log('("%s") "%s" : "%s" => "%s"', o, e, n.oldValue, n.newValue)
   }
});

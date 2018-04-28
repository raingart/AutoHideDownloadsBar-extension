var Storage = function () {
   const nameApp = chrome.runtime.getManifest().short_name;
   var saveParams = {};

   return {
      setParams: function (x, wantSync) {
         var storageArea = wantSync ? chrome.storage.sync : chrome.storage.local;
         storageArea.clear();

         saveParams[nameApp] = x;

         // storageArea.set(x, function () {
         //    chrome.runtime.lastError && console.log(chrome.runtime.lastError);
         // })
         storageArea.set(saveParams, function () {
            chrome.runtime.lastError && console.log(chrome.runtime.lastError);
         })
      },

      getParams: function (x, callback, wantSync) {
         var storageArea = wantSync ? chrome.storage.sync : chrome.storage.local;

         storageArea.get(x, function (items) {
            // console.log('saveParams '+JSON.stringify(items));
            var items = items[nameApp] && items[nameApp][items] ? items[nameApp][items] : items[nameApp] || items;
            chrome.runtime.lastError ? console.log(chrome.runtime.lastError) : callback(items);
         })
      },
   }
}();

chrome.storage.onChanged.addListener(function(changes, namespace) {
   for (key in changes) {
     var storageChange = changes[key];
   //   console.log('Storage key "%s" in namespace "%s" changed. ' +
   //               'Old value was "%s", new value is "%s".',
     console.log('("%s") "%s" : "%s" => "%s"',
                 key,
                 namespace,
                 storageChange.oldValue,
                 storageChange.newValue);
   }
 });

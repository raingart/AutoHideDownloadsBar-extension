console.log(i18n("app_name") + ": init runtimeListener.js");

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(details => {
   const manifest = chrome.runtime.getManifest();
   console.log('app ' + details.reason + ' ' + details.previousVersion + ' to ' + manifest.version);

   // sync storage migrate to local
   // reason impossibility during synchronization activation optional_permissions
   // chrome.storage.sync.get(null, storage => {
   //    switch (details.reason) {
   //       case 'update':
   //          // chrome.storage.local.set(storage);
   //          Storage.setParams(storage, 'local');
   //          chrome.storage.sync.clear();
   //          break;
   //    }
   // });

   chrome.storage.local.get(null, storage => {
      // const initialStorage = { );

      switch (details.reason) {
         case 'install':
            if (!Object.keys(storage).length) {
               chrome.runtime.openOptionsPage();
               // chrome.storage.local.set(initialStorage);
               // console.log('Apply initial configuration', JSON.stringify(initialStorage));
            }
            break;
         case 'update':
            break;
      }
   });
});

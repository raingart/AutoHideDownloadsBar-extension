console.log(i18n("app_name") + ": init runtimeListener.js");

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(details => {
   chrome.storage.sync.get(null, storage => {
      const manifest = chrome.runtime.getManifest();
      console.log('app ' + details.reason + ' ' + details.previousVersion + ' to ' + manifest.version);

      // const initialStorage = { );

      console.log(details.reason);
      switch (details.reason) {
         case 'install':
            if (!Object.keys(storage).length) {
               chrome.runtime.openOptionsPage();
               // chrome.storage.sync.set(initialStorage);
               // console.log('Apply initial configuration', JSON.stringify(initialStorage));
            }
            break;
         case 'update':
            break;
      }
   });
});

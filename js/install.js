console.debug("init install.js");

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(details => {
   const manifest = chrome.runtime.getManifest();

   console.debug(`app ${details.reason} ${details.previousVersion} to ` + manifest.version);

   chrome.storage.local.get(null, storage => {
      // const initialStorage = { );

      switch (details.reason) {
         case 'install':
            if (!Object.keys(storage).length) {
               chrome.runtime.openOptionsPage();
               // chrome.storage.local.set(initialStorage);
               // console.debug('Apply initial configuration', JSON.stringify(initialStorage));
            }
            break;
         // case 'update':
         //    break;
      }
   });
});

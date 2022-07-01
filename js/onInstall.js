console.debug("init onInstall.js");

// installed new version
chrome.runtime.onInstalled.addListener(details => {
   chrome.storage.local.get(null, storage => {
      const manifest = chrome.runtime.getManifest();
      console.debug(`app ${details.reason} ${details.previousVersion} to ` + manifest.version);

      // const initialStorage = { );

      switch (details.reason) {
         case 'install':
            if (!Object.keys(storage).length) {
               chrome.runtime.openOptionsPage();
            }
            break;
         // case 'update':
         //    break;
      }
   });
});

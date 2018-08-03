(function () {
   'use strict';
   
   console.log(i18n("app_name") + ": init runtimeListener.js");

   // Check whether new version is installed
   chrome.runtime.onInstalled.addListener(function (details) {
      const manifest = chrome.runtime.getManifest();

      console.log('app ' + details.reason + ' ' + details.previousVersion + ' to ' + manifest.version);

      if (details.reason === 'install') {
         // var defaultSetting = {
         //    'showNotification': true,
         // }
         // Storage.setParams(defaultSetting, true /* true=sync, false=local */ );

         chrome.runtime.openOptionsPage();

         // } else if (details.reason === 'update') {

      }
   });
}());

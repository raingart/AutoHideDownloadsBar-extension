console.log(i18n("app_name") + ": init uninstallListener.js");

const manifest = chrome.runtime.getManifest();

var uninstallUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdgDabLtk8vapLTEXKoXucHVXLrDujBrXZg418mGrLE0zND2g/viewform?usp=pp_url&entry.1936476946&entry.1337380930&entry.1757501795=";
uninstallUrl += encodeURIComponent(manifest.short_name + ' (v' + manifest.version + ')');

if (!App.debug)
   chrome.runtime.setUninstallURL(uninstallUrl, function (details) {
      var lastError = chrome.runtime.lastError;
      if (lastError && lastError.message) {
         console.warn("Unable to set uninstall URL: " + lastError.message);
      } else {
         // The url is set
      }
   });


// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
   console.log('app ' + details.reason + ' ' + details.previousVersion + ' to ' + manifest.version);
   if (details.reason === 'install') {
      var defaultSetting = {
         'showNotification': true,
      }
      Storage.setParams(defaultSetting, true /*sync*/ );

      chrome.runtime.openOptionsPage();

      // } else if (details.reason === 'update') {

   }
});

// "use strict";
var Storage = (function () {
	return {
		setParams: function (x, wantSync) {
			var storageArea = wantSync ? chrome.storage.sync : chrome.storage.local;
			storageArea.set(x,
				function () {
					if (chrome.runtime.lastError)
						console.log(chrome.runtime.lastError);
				}
			);
		},

		getParams: function (x, callback, wantSync) {
			var storageArea = wantSync ? chrome.storage.sync : chrome.storage.local;
			storageArea.get(x,
				function (items) {
					if (chrome.runtime.lastError)
						console.log(chrome.runtime.lastError);
					else
						callback(items);
				}
			);
		}
	};
})();

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (var key in changes) {
        var storageChange = changes[key];
        console.log('("%s") "%s" : ' +
        '"%s" => "%s"',
        namespace,
        key,
        storageChange.oldValue,
        storageChange.newValue);

        // console.log('Storage change: key=' + key + ' value=' + JSON.stringify(changes[key]));
    }
});

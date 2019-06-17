function click_addEventListener(element, leftCallback, rightCallback) {
   ["click", "contextmenu" /*, "mousedown"*/ ].forEach(event => {
      element.addEventListener(event, function (e) {
         // console.log('key-which: %s %s', e.which, e.type);
         e.preventDefault();
         switch (e.which) {
            case 1:
               if (leftCallback && typeof (leftCallback) === 'function') return leftCallback(this);
               break;
            case 3:
               // if (e.type !== 'contextmenu') break;
               if (rightCallback && typeof (rightCallback) === 'function') return rightCallback(this);
               break;
         }
      });
   });
}

// search? ex:
// ["change", "keyup"].forEach(event => {
//    document.querySelector('input[type=search]').addEventListener(event, function (e) {
//       searchFilter(this.value, document.getElementsByTagName('ul').children)
//    });
// });
function searchFilter(input, where) {
   // console.log('searchFilter', input);
   const filter = input.toLowerCase();

   for (const target of where) {
      let found = target.textContent || target.innerText;
      target.style.display = found.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
   }
}

function formatSpeed(ms, bytes) {
   let sec = ms / 1000;
   let speed = bytes / sec;
   let i = Math.floor(Math.log(speed) / Math.log(1024));
   return (!sec || isNaN(sec) ? '' : (speed / Math.pow(1024, i)).toFixed(2) * 1 + ['bytes', 'KB', 'MB', 'GB'][i] + '/s');
}

function formatBytes(bytes) {
   let i = Math.floor(Math.log(bytes) / Math.log(1024));
   return !bytes ? '---' : (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

function formatTimeLeft(ms) {
   let day, min, sec;
   return sec = Math.floor(ms / 1e3), !sec || isNaN(sec) ? '' : (day = Math.floor(sec / 86400), day > 0 ? day + " days" : (min = Math.floor(Math.log(sec) / Math.log(60)), Math.floor(sec / Math.pow(60, min)) + " " + ["sec", "mins", "hours"][min]))
}

function getFileNameFromPatch(filepath) {
   return filepath.split(/[\\/]/g).pop()
   // .split('.')[0];
}

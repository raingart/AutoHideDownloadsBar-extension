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

function searchFilter(keyword, containers, filterChildTagName) {
   // console.log('searchFilter', keyword);
   for (const item of containers) {
      let text = item.textContent;
      let found = text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
      let highlight = el => {
         el.innerHTML = el.innerHTML.replace(/<\/?mark[^>]*>/g, ''); // clear highlight tags
         if (found && keyword.toString().trim()) highlightSearchTerm(el, keyword, 'marked');
      };

      // vision
      item.style.display = found ? '' : 'none';

      if (filterChildTagName) { // fix reset input status
         item.querySelectorAll(filterChildTagName).forEach(highlight);
      }
   }
}

function highlightSearchTerm(container, keyword, highlightClass) {
   // fix
   let content = container.innerHTML,
      pattern = new RegExp('(>[^<.]*)?(' + keyword + ')([^<.]*)?', 'gi'),
      replaceWith = '$1<mark ' + (highlightClass ? 'class="' + highlightClass + '"' : 'style="background-color:#afafaf"') + '>$2</mark>$3',
      marked = content.replace(pattern, replaceWith);

   return (container.innerHTML = marked) !== content;
}

function formatSpeed(ms, bytes) {
   let sec = ms / 1000;
   let speed = bytes / sec;
   let i = Math.floor(Math.log(speed) / Math.log(1024));
   if (speed < 1 ) return '';
   return (speed / Math.pow(1024, i)).toFixed(2) * 1 + ['bytes', 'KB', 'MB', 'GB'][i] + '/s';
}

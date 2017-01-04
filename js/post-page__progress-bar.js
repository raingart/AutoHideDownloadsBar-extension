/**
 * Индикация прочтения статьи
 * @author raingart (@gmail.com)
 * @link http://
 */

//~ $(function() {
jQuery(document).ready(function($) {
// document.addEventListener('DOMContentLoaded', function () {

// console.log('start chrome-extension);

    addProgressHeader();

    var articlesArray      = "",
        articlesFraming    = "",
        progress_container = document.querySelector(".progress-container"),
        bar                = document.querySelector('#reading-position-indicator');
        // bar = document.querySelector('html::before');
    progress_container.style.visibility = 'hidden';

    function restoreOptions(items) {
        articlesArray      = items.articleArea.split(' ');
        articlesFraming    = items.articlesFraming === true ? 'article-reading' : '';

        bar.style.background = "#" + items.barColorPicker;
        bar.style.height     = items.barHeight+'px';
    }

    function updateProgress(percent, elm) {
        elm.style.width = Math.round(100 * percent) + "%";
        elm.setAttribute("title", percent);
    }
    // function isEmpty(obj) {
    //     return !Object.keys(obj).length ? true: false;
    // }
    var scrolllock = false;

    function calculateProgress(div_articles) {
        // console.log(scrolllock);
        if (scrolllock) {
            return false;
        }
        scrolllock = true;
        var windowHeight     = window.innerHeight,
            scrollTop        = window.scrollY,
            scrollPercentage = 0;

        div_articles.forEach(function(value, index) {
        // $.each(div_articles, function(index, value) {
            // console.log(value)
            $(value).each(function() {
                // console.log(value);
                scrolllock = false;
                var article            = $(this),
                    articleTop         = article.offset().top, // offsetTop
                    articleOuterHeight = article.outerHeight(), // outerHeight
                    articleHeight      = articleOuterHeight - windowHeight;

                if (scrollTop >= articleTop && (articleTop + articleHeight) > scrollTop) {
                    scrollPercentage = (scrollTop - articleTop) / articleHeight;
                    progress_container.style.visibility = 'visible';
                    article.addClass(articlesFraming);
                    return false;
                } else {
                    scrollPercentage = 0;
                    progress_container.style.visibility = 'hidden';
                    article.removeClass(articlesFraming);
                }
            });
            updateProgress(scrollPercentage, bar);
        });
    }

    Storage.getParams(null, restoreOptions, chrome.storage.sync);

    window.addEventListener('scroll', function() {
    // window.scroll('scroll', function()
        calculateProgress(articlesArray);
    });

    window.addEventListener('resize', function() {
        calculateProgress(articlesArray);
    });
});


// chrome.runtime.sendMessage({greeting: "restoreOptions"}, function(response) {
//   console.log('>>'+response.farewell);
// });

//called when the extension connects to this script
/*chrome.runtime.onConnect.addListener(function(port) {
	port.postMessage({data : 'connected'});

	port.onMessage.addListener(function onMessage(request) {

		//this method is called by the extension when the extension is enabled or installed
		//or when the page is loaded
		if(request.method == 'install'){

			// this is equivalent to a page load
			chromeARP = new Extension(request.settings);

			port.postMessage({data : 'installed Extension from port'});
		}

		// called when extension icon is clicked and when tab is activated
		if(request.method == 'updateStatus'){

			if(document.readyState == 'complete'){

				if(getCurrentExtension()){

					if(!equals(request.settings, chromeARP.settings, {filter : ['date', 'time']})){

						chromeARP.init(request.settings);

						port.postMessage({data : 'extension is updated'});

					}else{
						port.postMessage({data : 'extension is idle'});
					}

				}else{
					port.postMessage({data : 'no extension installed'});
				}
			}else{
				port.postMessage({data : 'document not ready'});
			}
		}

	});
});*/

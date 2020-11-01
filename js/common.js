console.debug("init common.js");

function bytesToSize(bytes) {
   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes === 0) return 'n/a';
   const i = parseInt(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), 10);
   return (i === 0 ? bytes : (bytes / (1024 ** i)).toFixed(2)) + sizes[i];
}

function formatTimeLeft(ms) {
   if (!ms) return;
   const sec = Math.floor(ms / 1e3);
   const min = Math.floor(Math.log(sec) / Math.log(60));
   const day = Math.floor(sec / 86400);
   return day ? day + " days" : Math.floor(sec / Math.pow(60, min)) + ["sec", "mins", "hours"][min];
}

function getFileNameFromPatch(filepath) {
   return filepath.split(/[\\/]/g).pop()
   // .split('.')[0];
}

/////////////////////////////////////////

function percentageToHsl(percentage) {
   // set gradient
   // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
   const hueData = {
      'startingHue': 0,
      'endingHue': 120,
      'saturation': 100,
      'lightness': 50
   };
   const hue = Math.round((percentage * (hueData.startingHue - hueData.endingHue)) + hueData.endingHue);
   return `hsla(${hue}, ${hueData.saturation}%, ${hueData.lightness}%, 0.8)`;
}

function dataForDraw(progress) {
   const colorRainbow = color => !color || color === '#00ff00' ? percentageToHsl(progress / 100) : color;

   let dataDrawing = {
      'bg_color': colorRainbow(App.sessionSettings['colorPicker']),
      'text_color': App.sessionSettings['colorPickerText'],
      'progressRatio': (+progress / 100),
      'text': progress,
   }

   switch (progress) {
      case 'dangerFile':
         dataDrawing.text = flashing(['⚠️', '']);
         dataDrawing.text_color = 'red';
         break;

      case Infinity:
         dataDrawing.text = flashing();
         break;
   }

   App.log('dataDrawing', JSON.stringify(dataDrawing));

   return dataDrawing;

   function flashing(text) {
      const loadingSymbol = text && Array.isArray(text) ? text : ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      App.circleNum = App.circleNum < loadingSymbol.length - 1 ? ++App.circleNum : 0;
      return loadingSymbol[App.circleNum];
   }
}

function drawToolbarIcon(progress) {
   const dataForDrawing = dataForDraw(progress);
   const canvas = genCanvas();

   return drawProgressBar(dataForDrawing.progressRatio).getImageData(0, 0, canvas.width, canvas.height);

   function drawProgressBar(ratio) {
      let ctx = canvas.getContext('2d');

      // add background
      ctx.fillStyle = 'hsla(0, 0%, 0%, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // add progress
      ctx.fillStyle = dataForDrawing.bg_color;
      ctx.fillRect(0, 0, parseInt(canvas.width * ratio), canvas.height);

      // add pt
      if (App.sessionSettings['typeIconInfo'] != 'svg_notext' && +dataForDrawing.text !== Infinity) {
         // create style text
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.font = '11px Arial';
         // ctx.shadowColor = 'white';
         // ctx.shadowBlur = 1;
         ctx.fillStyle = dataForDrawing.text_color || '#888';
         ctx.fillText(dataForDrawing.text, (canvas.width / 2), (canvas.height / 2));
      }
      return ctx;
   }

   function genCanvas() {
      let cvs = document.createElement('canvas');
      // cvs.setAttribute('width', 19);
      // cvs.setAttribute('height', 6);
      cvs.width = 16;
      cvs.height = 16;
      return cvs;
   }
}

function notificationCheck(item) {
   if (item?.state?.previous === 'in_progress') {
      let notiData = {};
      let audioPatch;

      switch (item.state.current) {
         case 'complete':
            notiData.title = i18n("noti_download_complete");
            audioPatch = '/audio/complete.ogg';
            break;

         case 'interrupted':
            if (item.error.current === 'USER_CANCELED') {
               // notiData.title = i18n("noti_download_canceled");
            } else {
               notiData.title = i18n("noti_download_interrupted");
               // notiData.requireInteraction = true; //cancel automatically closing
               notiData.icon = '/icons/dead.png';
               audioPatch = '/audio/interrupted.ogg';
            }
            break;
         default:
            console.debug('item.state.current', item.state.current);
      }
      // audio alert
      if (App.sessionSettings["soundNotification"] && audioPatch) {
         webBrowser.notification.playAudio(audioPatch);
      }

      if (App.sessionSettings["showNotification"] && Object.keys(notiData).length) {
         chrome.downloads.search({ id: item.id }, downloads => {
            let download = downloads[0];
            let timePassed = Date.parse(download.endTime) - Date.parse(download.startTime);
            let fileName = getFileNameFromPatch(download.filename);
            let minTimeLevel = 1500; // ms

            // skip notifity small file/small size
            if (download.fileSize <= 1 || timePassed < minTimeLevel) return;

            // App.log('timePassed', timePassed);
            // App.log('download.fileSize', download.fileSize);
            App.log('Done get download\n%s', JSON.stringify(download));

            notiData.title = `${i18n("noti_download_title")} ${notiData.title}`;
            notiData.body = fileName.toString().slice(0, 31) + '...';
            // notiData.downloadId = item.id;

            webBrowser.notification.send(notiData);
         });
      }
   }
}

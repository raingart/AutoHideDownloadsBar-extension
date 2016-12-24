function internationalize( str ) {
		// "__MSG_formTitle__"
		// return str.replace( /__MSG_([^_]+)__/g, function ( m, key ) {
		return str.replace(/__MSG_(\w+)__/g, function ( m, key ) {
				return chrome.i18n.getMessage( key );
		} );
}

function setLocalization() {
		document.getElementsByTagName( 'body' )[0].innerHTML = internationalize( document.getElementsByTagName( 'body' )[0].innerHTML );
/*
		//Localize by replacing __MSG_***__ meta tags
		var objects = document.getElementsByTagName('body');
		// var objects = document.getElementsByTagName('html');
		for (var j = 0; j < objects.length; j++)
		{
				var obj = objects[j];

				var valStrH = obj.innerHTML.toString();

				var valNewH = internationalize( valStrH );

				if(valNewH != valStrH)
				       obj.innerHTML = valNewH;
		}*/

}


//~ window.onload = restoreOtions
setLocalization();

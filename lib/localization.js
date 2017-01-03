function internationalize( str ) {
		// "__MSG_formTitle__"
		// return str.replace( /__MSG_([^_]+)__/g, function ( m, key ) {
		return str.replace(/__MSG_(\w+)__/g, function ( m, key ) {
				return chrome.i18n.getMessage( key );
		} );
}
function setLocalization() {
		document.getElementsByTagName( 'body' )[0].innerHTML = internationalize( document.getElementsByTagName( 'body' )[0].innerHTML );
}

setLocalization();

//begin example_code_Dialogs
// var html = document.getElementsByTagName( 'body' )[0].innerHTML;
// document.getElementsByTagName( 'body' )[0].innerHTML = (function () {
// 			var me = this;
// 			return me.replace(/__MSG_(\w+)__/g, function ( m, key ) {
// 					return chrome.i18n.getMessage( key );
// 			} );
// })();

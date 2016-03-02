/* 	Algthm
 *	bootstrapping configuration 
*/

(function($, Backbone, exports) {

	//	Container is the root view of the application.
	exports.container = '#window';

	exports.search_api_base = 'http://algthm.io:8888';

	//	Initialize storage for Model, View and Collection instances.
	exports.storage = exports.storage || {
		models: {},
		views: {},
		collections: {}
	};

	exports.util = exports.util || {};

	exports.util.shuffle = function(array) {
		var m = array.length, t, i;

		// While there remain elements to shuffle…
		while (m) {
			// Pick a remaining element…
			i = Math.floor(Math.random() * m--);

			// And swap it with the current element.
			t = array[m];
			array[m] = array[i];
			array[i] = t;
		}

		return array;
	}

})(jQuery, Backbone, window);
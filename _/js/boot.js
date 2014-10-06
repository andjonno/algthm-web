/* 	Algthm
 *	bootstrapping configuration 
*/

(function($, Backbone, exports) {

	//	Container is the root view of the application.
	exports.container = '#window';

	exports.search_api_base = 'http://localhost:8888';

	//	Initialize storage for Model, View and Collection instances.
	exports.storage = exports.storage || {
		models: {},
		views: {},
		collections: {}
	};

})(jQuery, Backbone, window);
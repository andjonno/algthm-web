/* 	Algthm Router 
*/

(function(Backbone, exports){

	exports.router = Backbone.Router.extend({
		routes: {
			"": "search",
			"!/": "search",
			"!/search/:query": "results"
		},

		search: function() {
			exports.scaffold('search');
			exports.storage.views.search = (new exports.controllers.search()).render();
		},

		results: function(query) {
			exports.scaffold('results');
			// Create a new query model
			exports.storage.models.query = new exports.models.query({
				query: query
			});
			exports.storage.views.results = (new exports.controllers.results({
				model: exports.storage.models.query
			})).render();
		}
	});

	/* Scaffolding lays down the wireframe for certain routes. */
	exports.scaffold = function(page) {
		$(exports.container).html($("#" + page + "-tpl").html());
	}

})(Backbone, window);
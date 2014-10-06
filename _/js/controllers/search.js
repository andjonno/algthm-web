/* Algthm
 * SearchController is the home page of algthm featuring the classic 
 * full screen search input.
 */

(function($, Backbone, exports) {

	/* Get the controllers object */
	exports.controllers = exports.controllers || {};

	exports.controllers.search = Backbone.View.extend({
		el: '#search',

		/* Bind events to form */
		events: {
			'submit form': 'submit'
		},

		submit: function(e) {
			var q = encodeURIComponent($(e.target).serializeArray()[0].value);
			exports.router.navigate('!/search/' + q, {trigger: true});
			return false;
		}
	});

})(jQuery, Backbone, window);

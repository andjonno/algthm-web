/* Algthm
 * Controllers for various page functions.
 */

(function($, Backbone, exports) {

	exports.controllers = exports.controllers || {};

	exports.controllers.loader = Backbone.View.extend({
		el: "#loader",
		show: function() {
			this.$el.fadeIn();
			var self = this;
			setTimeout(function() {
				self.hide()
			}, 5000);
		},
		hide: function() {
			this.$el.fadeOut();
		}
	})

})(jQuery, Backbone, window);

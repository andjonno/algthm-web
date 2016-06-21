/* Result stats controls the display of data in a result item view.
 */

(function($, Backbone, Mustache, _, exports) {

	exports.controllers = exports.controllers || {};

	exports.controllers.result_stats = Backbone.View.extend({
		initialize: function() {
			this.result_id = this.model.get("_id");
			this.metrics = exports.storage.collections.metrics = new exports.collections.metrics();
			this.contributors = exports.storage.collections.contributors = new exports.collections.contributors();

			// Populate collection with model
			this.load_metrics();

			// Load consuming views
			$("#_" + this.result_id + " .stats").html((new exports.controllers.result_stats_table({model: this.metrics})).render().el);
			$("#_" + this.result_id + " .contributors").html((new exports.controllers.result_contributors({model: this.contributors})).render().el);
		},
		load_metrics: function() {
			var next = this.metrics.length,
				url = 'http://localhost:8888/metrics/' + this.model.get("_id") + "?next=" + next,
				self = this;
			
			$.getJSON(url, function(data) {
				if (data.metrics.length)
					self.metrics.add(data.metrics);

				if (data.contributors.length)
					self.contributors.add(data.contributors);
			});
		}
	});

	exports.controllers.result_stats_table = Backbone.View.extend({
		className: "table",
		template: function() {
			return "<div class=\"row\"><div class=\"title\">{{key}}</div><div class=\"value\">{{value}}</div>";
		},
		initialize: function() {
			this.model = exports.storage.collections.metrics;
			this.model.on("add", this.render, this);
		},
		render: function() {
			this.$el.html('');
			// rows
			var model = exports.storage.collections.metrics.at(0),
				keys = [],
				whitelist = ['activity', 'commit_count', 'commit', 'timestamp']

			if (model) {
				model = model.toJSON();
				keys = _.sortBy(_.intersection(_.keys(model), whitelist));
				for (var i = 0; i < keys.length; i++) {
					this.$el.append(Mustache.to_html(this.template(), {
						key: keys[i].replace("_", " "),
						value: model[keys[i]]
					}));
				}
			}
			return this;
		}
	});

	exports.controllers.result_contributors = Backbone.View.extend({
		tagName: "ul",
		template: function() {
			return $("#contributor-tpl").html();
		},
		initialize: function() {
			this.model.on("add", this.render, this);
		},
		render: function(model) {
			if (model)
				this.$el.html(this.$el.html() + Mustache.to_html(this.template(), model.toJSON()));
			return this;
		}
	});

})(jQuery, Backbone, Mustache, _, window);
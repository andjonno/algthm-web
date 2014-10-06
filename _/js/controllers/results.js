/* Algthm
 * Controllers for the results view.
 */

(function($, Backbone, Mustache, _, exports) {

	exports.controllers = exports.controllers || {};

	/* Results is a global controller for the results page. */
	exports.controllers.results = Backbone.View.extend({

		template: function() {
			return $("#results-tpl").html();
		},

		initialize: function() {
			this.run_query();

			// Create results collection
			exports.storage.collections.results = new exports.collections.results();

			// Initialize subviews
			exports.storage.views.loader = new exports.controllers.loader();
			exports.storage.views.header_search = 
				(new exports.controllers.header_search({
					model: this.model
				}));
			exports.storage.views.results_list =
				(new exports.controllers.results_list({
					collection: exports.storage.collections.results
				}));
			exports.storage.views.context_bar = 
				(new exports.controllers.context_bar({
					model: this.model
				})).render();
		},

		render: function() {
			var self = this;
			this.$el.html(Mustache.to_html(this.template(), this.model.toJSON()));
			return this;
		},

		run_query: function() {
			// Call the search api with the query
			var call = exports.search_api_base + "/query?q=" + this.model.get("query"),
				self = this;
			$("title").html("\"" + this.model.get("query") + "\" &bull; Algthm");
			$.getJSON(call, function(data) {
				self.process_response(data);
			});
		},

		process_response: function(data) {
			this.model.set({
				total_results: data.total_results,
				response_time: data.response_time,
				transaction: data.transaction
			});

			exports.storage.views.loader.hide();

			var result;
			for (var a = 0; a < data.results.length; a++) {
				result = data.results[a];
				exports.storage.collections.results.add(
					new exports.models.result({
						homeLink: result._source.repository.url,
						canonicalName: result._source.repository.canonical_name,
						star: data.max_score == result._score,
						readme: result._source.text.readme || "",
						_highlighting: result._source.text._highlighting,

						common: result._source.repository.languages.common,
						secondary: result._source.repository.languages.secondary,

						_score: result._score,
						_id: result._id,
						_processed: result._source.processed
					})
				)
			}
		}

	});

	/* Context bar manages the bar containing the "342 results in 0.65 seconds" 
	 * view. 
	*/
	exports.controllers.context_bar = Backbone.View.extend({

		el: "#context-bar",

		initialize: function() {
			this.model.on("change", this.render, this);
		},

		template: function() {
			return $("#context-bar-tpl").html();
		},

		render: function() {
			this.$el.html(Mustache.to_html(this.template(), this.model.toJSON()));
			return this;
		}

	});

	/* Results list
	 */
	exports.controllers.results_list = Backbone.View.extend({
		el: "#results",

		initialize: function() {
			this.collection.on("add", this.append, this);

			// bind page scroll
			$(window).scroll(function() {
				if($(window).scrollTop() + $(window).height() >= $(document).height()) {
					if (window.storage.collections.results.has_more()) {
						exports.storage.views.loader.show();
					}
				}
			});
		},

		append: function(model) {
			this.$el.append((new exports.controllers.result({model: model})).render().el);
		}
	});

	/* Result
	 */
	exports.controllers.result = Backbone.View.extend({
		className: "result",
		template: function() {
			return $("#result-tpl").html();
		},
		initialize: function() {

		},
		render: function() {
			this.$el.html(Mustache.to_html(this.template(), this.model.toJSON()));
			return this;
		}
	});

	exports.controllers.header_search = Backbone.View.extend({
		el: "#header-search",
		template: function() {
			return $("#header-search-tpl").html();
		},
		initialize: function() {
			this.render();
			this.auto = new exports.controllers.autosuggest();
		},
		render: function() {
			this.$el.html(Mustache.to_html(this.template(), this.model.toJSON()));
			return this;
		},
		events: {
			"submit form": "submit",
			"keyup input[name=q]": "keyup",
			"blue input[name=q]": "blur",
		},
		submit: function(e) {
			var model = this.auto.suggestions.findWhere({_selected: true}),
				q = "";
			if (model)
				q = encodeURIComponent(model.get("original"));
			else
				q = encodeURIComponent($(e.target).serializeArray()[0].value);
			exports.router.navigate("!/search/" + q, {trigger: true});
			return false;
		},
		keyup: function(e) {
			if (e.keyCode == 27) // escape
				this.blur();
			else
				this.auto.keyup(e);
			
		},
		blur: function() {
			$("#header-search-input").blur();
			this.auto.hide();
		}
	});

	exports.controllers.autosuggest = Backbone.View.extend({
		el: "#autosuggest",
		initialize: function() {
			this.suggestions = new exports.collections.autosuggestions();
			this.suggestions.on("add", this.render, this);

			// Denotes the selected suggestion, -1 == input.
			this.selected = -1;

			// Establish connectin to the server.
			var self = this;
			this.connection = new WebSocket("ws://localhost:8888/_auto");
			this.connection.onopen = function(data) {
				self.est = true;
			}
			this.connection.onmessage = function(data) {
				// populate the collection
				json = JSON.parse(data.data);
				if (!data.data || json.suggestions.length == 0) {
					self.hide()
					return
				}

				self.show();
				self.suggestions.reset();
				self.suggestions.add(json.suggestions);
				self.ghosting();
			}
			this.connection.onerror = function(data) {
				self.est = false;
			}
		},
		render: function() {
			// clearing the old suggestions
			var self = this;
			this.$el.html("");
			_.each(this.suggestions.models, function(model, x) {
				if (self.selected == x)
					model.select();
				self.$el.append((new exports.controllers.suggestion({
					model: model
				})).render().el);
			});
		},
		suggest: function(query) {
			if (query != exports.storage.models.query.get("query"))
				this.show();

			this.suggestions.highlight(query);

			// Request suggestions after a 2 second cooloff from typing.
			var self = this;
			clearTimeout(this.timeout);
			this.timeout = setTimeout(function() {
				if (self.est)
					self.connection.send(query);
			}, 50);
		},
		ghosting: function() {
			var model = this.suggestions.findWhere({rank: 1}),
				text = "";
			if (model)
				text = model.get("suggestion");
			$("#ghosting").text(text);
		},
		hide: function() {
			this.$el.hide();
		},
		show: function() {
			this.$el.show();
		},

		keyup: function(e) {

			/* Key directions.
			   L: 37, U: 38, R: 39, D: 40
			   Enter: 13

			   Non default actions for pressing arrow keys
			   Right -> "fill query with whats in the ghosting",
			   Up & Down -> "Selected between input & suggestions"
			   Left -> "none"

			   Enter -> "execute selected query"
			*/
			switch (e.keyCode) {
				case 38:
					this.up_down("up");
					break;
				case 39:
					this.right();
					break;
				case 40:
					this.up_down("down");
					break;
				default:
					this.suggest($(e.target).val());
					break;
			}
		},

		// Key mapping handlers
		right: function() {
			// fill input with ghosting contents
			$("#header-search-input").val($("#ghosting").text());
		},
		up_down: function(dir) {
			// handles selecting between suggestions with arrow keys
			var inc = dir == "down" ? 1 : -1;
			// Prevent selected going beyond -1
			if (this.selected + inc < -1)
				return;

			// Ensure selection will be in bounds
			if (this.selected + inc <= this.suggestions.length - 1) {
				this.selected += inc;
			}
			this.suggestions.select(this.selected);
			var model = this.suggestions.findWhere({_selected: true});
			if (model)
				$("#ghosting").text(model.get("original"));

		},
	});

	exports.controllers.suggestion = Backbone.View.extend({
		template: function() {
			return "<div><a href=\"#!/search/{{original}}\" class=\"{{#_selected}}selected{{/_selected}}\">{{{suggestion}}}</a></div>";
		},
		initialize: function() {
			this.model.on("change", this.render, this);
		},
		render: function() {
			this.$el.html(Mustache.to_html(this.template(), this.model.toJSON()));
			return this;
		}
	});

})(jQuery, Backbone, Mustache, _, window);

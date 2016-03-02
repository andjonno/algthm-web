/* Algthm
 * Model and Collection definitions.
 */

(function($, Backbone, exports) {

	exports.models = exports.models || {};
	exports.collections = exports.collections || {};

	exports.models.query = Backbone.Model.extend({
		defaults: {
			query: "",
			page: 1,
			timestamp: (new Date()).getTime(),
			total_results: 0,
			response_time: 0,
			transaction: ""
		},
		page_count: function() {
			return Math.ceil(this.get("total_results") / 10);
		}
	});

	exports.models.result = Backbone.Model.extend({
		defaults: {
			homeLink: "",
			canonicalName: "",
			star: false,
			readme: "",
			_highlighting: {},
			languages: {},

			_score: 0.0,
			_id: "",
			_processed: "",
		},

		initialize: function() {
			// bold all highlighting if contains readme
			var readme = this.get("readme");
			if (readme)
				this.highlighting();

			var languages = this.get("languages"),
				filtered = [],
				// Any lang less than 5% percent should be put in the "other" bin.
				other = {
					language: "Other",
					label: "Other",
					percentage: 0.0,
					colour: "",
				},
				lang,
				colours = exports.util.shuffle(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);

			// round percentage and determine whether language has enough share 
			// of percentage to be solo or put in the "other" bin.
			for (var a = 0; a < languages.length; a++) {
				// ignore anything with 1, rounding error in es.
				/*if (languages[a].percentage == 1) {
				} else */if (languages[a].percentage > 0.1) {
					languages[a].percentage = Math.round(languages[a].percentage * 100);
					languages[a].label = languages[a].language + " <span>" + languages[a].percentage + "%</span>";
					filtered.push(languages[a])
				} else {
					other.percentage += languages[a].percentage;
				}
			}
			if (other.percentage > 0) {
				other.percentage = Math.round(other.percentage * 100);
				filtered.push(other);
			}
			// Tag with colour
			for (var l = 0; l < filtered.length; l++) {
				if (filtered[l].language != "other")
					filtered[l].colour = colours[l % colours.length];
				else
					filtered[l].colour = "c";
			}
			this.set({languages: filtered});
		},

		highlighting: function() {
			var readme = this.get("readme").split(' ');
			var hl = this.get("_highlighting").at;

			// get tuple, (index, start, end)
			// index is the word, start and end are the slicing to be done on 
			// the word
			var slice = "",
				tuple = [];
			for (var a = 0; a < hl.length; a++) {
				tuple = hl[a];
				slice = readme[tuple[0]].substr(tuple[1], tuple[2]);
				readme[tuple[0]] = readme[tuple[0]].replace(slice, "<span class=\"hl\">" + slice + "</span>");
			}

			// commit bolding
			this.set({readme: readme.splice(0,40).join(' ')});
		}
	});

	exports.collections.results = Backbone.Collection.extend({
		model: exports.models.result,
		has_more: function() {
			return exports.storage.models.query.get("total_results") > this.length;
		}
	});

	/* Autosuggestion represents a suggested item based on the current query. 
	*/
	exports.models.autosuggestion = Backbone.Model.extend({
		defaults: {
			suggestion: "",
			original: "",
			rank: 0.0,
			_selected: false
		},
		initialize: function() {
			this.set({original: this.get("suggestion")});
		},
		select: function() {
			this.set({_selected: true});
		}
	});

	exports.collections.autosuggestions = Backbone.Collection.extend({
		model: exports.models.autosuggestion,
		sortBy: function(model) {
			return model.get('rank');
		},
		highlight: function(query) {
			_.each(this.models, function(model) {
				var q = query.split(" ");
				var suggestion = model.get("original").split(" ");
				// 'span' any words matching in an unbroken sequence.
				for (var a = 0; a < q.length; a++) {
					try {
						if (q[a] == suggestion[a])
							suggestion[a] = "<span>" + suggestion[a] + "</span>";
						else {
							// check substring, maybe half through 
							if (suggestion[a].indexOf(q[a]) == 0) {
								suggestion[a] = suggestion[a].replace(q[a], "<span>" + q[a] + "</span>");
							} else {
								// no match
								break;
							}
						}
					} catch(e) {
						// don't care..
					}
				}
				model.set({suggestion: suggestion.join(" ")});
			});
		},
		select: function(index) {
			if (index > this.length - 1)
				return;
			for (var a = 0; a < this.length; a++)
				this.models[a].set({_selected: false});
			if (0 <= index && index < this.length)
				this.models[index].select();
		}
	});

	exports.models.metric = Backbone.Model.extend({
		defaults: {
			_id: "",
			activity: 0,
			additions: 0,
			deletions: 0,
			commit: "",
			commit_count: 1,
			timestamp: "2008-09-08 21:54:31"
		}
	});

	exports.collections.metrics = Backbone.Collection.extend({
		model: exports.models.metric
	});

	exports.models.contributor = Backbone.Model.extend({
		defaults: {
			name: "",
			email: "",
			hash: "",
		},
		initialize: function() {
			this.set({hash: md5(this.get("email"))});
		}
	});

	exports.collections.contributors = Backbone.Collection.extend({
		model: exports.models.contributor
	});

})(jQuery, Backbone, window);

cordova.define("com.malex.cordova.plugin.restarter.restarter", function(require, exports, module) { window.plugins = window.plugins || {};

window.plugins.restarter = {
	restart: function() {
		return cordova.exec(function(winParam) {},
			function(error) {},
			"Restarter",
			"restart", []);
	}
};
});

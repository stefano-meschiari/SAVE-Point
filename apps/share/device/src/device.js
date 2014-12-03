;(function (name, definition) {
	"use strict";
	var hasDefine = typeof define === 'function';
	var hasExports = typeof module !== 'undefined' && module.exports;

	if (hasDefine) {
		// AMD Module or CMD Module
		define(definition);
	} else if (hasExports) {
		// Node.js Module
		module.exports = (function () {
			var os = require("os");
			var device = {
				tmpdir: 'There is no tmpdir found!',
				endianness: 'There is no endianness found!',
				hostname: 'There is no hostname found!',
				type: 'There is no type found!',
				platform: 'There is no platform found!',
				arch: 'There is no arch found!',
				release: 'There is no release found!',
				uptime: 'There is no uptime found!',
				loadavg: 'There is no loadavg found!',
				totalmem: 'There is no totalmem found!',
				networkInterfaces: 'There is no networkInterfaces found!',
				EOL: 'There is no EOL found!',
				cpus: 'There is no cpus found!',
				getNetworkInterfaces: 'There is no getNetworkInterfaces found!',
				tmpDir: 'There is no tmpDir found!'
			};
			for (var v in os) {
				if (({}).hasOwnProperty.call(os, v)) {
					if (typeof os[v] === 'function') {
						device[v] = os[v]();
					} else {
						device[v] = os[v];
					}
				}
			}
			return device;
		})();
	} else {
		// Assign to common namespaces or simply the global object (window)
		this[name] = definition();
	}
})('device', function () {
	"use strict";
	function device(w) {
		var browser = {};

		var versionSearchString;
		var idx;
		var dataString = w.navigator.userAgent;
		var dataBrowser = [
			{
				string: dataString,
				subString: new RegExp("OmniWeb", 'i'),
				versionSearch: "OmniWeb/",
				identity: "OmniWeb"
			},
			{
				string: w.navigator.vendor,
				subString: new RegExp("iCab", 'i'),
				identity: "iCab"
			},
			{
				string: w.navigator.vendor,
				subString: new RegExp("KDE", 'i'),
				identity: "Konqueror"
			},
			{
				string: w.navigator.vendor,
				subString: new RegExp("Camino", 'i'),
				identity: "Camino"
			},
			{
				string: dataString,
				subString: new RegExp("Netscape", 'i'),
				identity: "Netscape"
			},
			{
				string: dataString,
				subString: new RegExp("Gecko", 'i'),
				identity: "Mozilla",
				versionSearch: "rv"
			},
			{
				string: dataString,
				subString: new RegExp("Mozilla", 'i'),
				identity: "Netscape",
				versionSearch: "Mozilla"
			}
		];
		var dataOS = [
			{
				string: dataString,
				subString: new RegExp("Windows CE", 'i'),
				identity: "WinCE"
			},
			{
				string: dataString,
				subString: new RegExp("Windows Phone", 'i'),
				identity: "WinPhone"
			},
			{
				string: dataString,
				subString: new RegExp("Xbox", 'i'),
				identity: "Xbox"
			},
			{
				string: w.navigator.platform,
				subString: new RegExp("Win", 'i'),
				identity: "Windows"
			},
			{
				string: w.navigator.platform,
				subString: new RegExp("Mac", 'i'),
				identity: "Mac"
			},
			{
				string: dataString,
				subString: new RegExp("iPhone", 'i'),
				identity: "iPhone"
			},
			{
				string: dataString,
				subString: new RegExp("iPad", 'i'),
				identity: "iPad"
			},
			{
				string: dataString,
				subString: new RegExp("iPod", 'i'),
				identity: "iPod"
			},
			{
				string: dataString,
				subString: new RegExp("Android", 'i'),
				identity: "Android"
			},
			{
				string: dataString,
				subString: new RegExp("BlackBerry", 'i'),
				identity: "BlackBerry"
			},
			{
				string: dataString,
				subString: new RegExp("hpwOS|webOS", 'i'),
				identity: "webOS"
			},
			{
				string: w.navigator.platform,
				subString: new RegExp("Linux", 'i'),
				identity: "Linux"
			}
		];

		function searchString(data) {
			var i;
			for (i = 0; i < data.length; i++) {
				var dataString = data[i].string;
				versionSearchString = data[i].versionSearch || data[i].identity;
				if (dataString) {
					if (dataString.match(data[i].subString)) {
						return data[i].identity;
					}
				}
			}
			return '';
		}

		function searchVersion(dataString) {
			var index = dataString.indexOf(versionSearchString);
			if (index === -1) {
				return '';
			}
			return parseFloat(dataString.substring(index + versionSearchString.length + 1));
		}

		if ("ActiveXObject" in w) {
			browser = {
				engine: "trident",
				agent: "msie",
				ver: w.XMLHttpRequest ? (w.document.querySelector ? (w.document.addEventListener ? (w.atob ? (w.execScript ? 10 : 11) : 9) : 8) : 7) : 6
			};
		} else if ("opera" in w) {
			var index;
			browser = {
				engine: "presto",
				agent: "opera",
				ver: ((index = dataString.indexOf("Version")) !== -1) ?
					parseFloat(dataString.substring(index + 8)) :
					parseFloat(dataString.substring(dataString.indexOf("Opera") + 6))
			};
		} else if ("MozBoxSizing" in w.document.documentElement.style) {
			browser = {
				engine: "gecko",
				agent: "firefox",
				ver: parseFloat(dataString.substring(dataString.indexOf("Firefox") + 8))
			};
		} else if ("WebkitTransform" in w.document.documentElement.style) {
			browser = {
				engine: "webkit",
				agent: "webkit",
				ver: parseFloat(dataString.substring(dataString.indexOf("Version") + 8)),
				webkit_ver: parseFloat(dataString.substring(dataString.indexOf("AppleWebKit/") + 12))
			};

			if (Object.prototype.toString.call(w.HTMLElement).indexOf('Constructor') > 0) {
				idx = dataString.indexOf('CriOS');
				if (idx != -1) {
					browser.agent = 'chrome';
					browser.ver = parseFloat(dataString.substring(idx + 6));
				}
				else
					browser.agent = 'safari';
			} else {
				idx = dataString.indexOf('Chrome');
				if ("chrome" in w || idx != -1)
					browser.agent = 'chrome';

				if (idx != -1)
					browser.ver = parseFloat(dataString.substring(idx + 7));
			}
		} else {
			browser = {
				agent: searchString(dataBrowser),
				ver: searchVersion(dataString) || searchVersion(w.navigator.appVersion) || 0
			};
		}

		browser.cordova = ("cordova" in w);
		browser.os = (searchString(dataOS) || "an unknown OS");
		browser[browser.os] = true;
		browser[browser.engine] = true;

		if (browser.os == 'iPhone' || browser.os == 'iPad' || browser.os == 'iPod') {
			browser.ios = true;

			if (browser.agent == 'safari') {
				browser.ver = parseFloat(dataString.substring(dataString
					.indexOf("OS") + 3));

				if (w.navigator.standalone)
					browser.webApp = true;
			}
		}

		if (browser.os == 'Windows' || browser.os == 'Mac' || browser.os == 'Linux')
			browser.desktop = true;

		var rate = w.screen.width / w.document.documentElement.clientWidth;
		if (!browser.desktop && (w.screen.width / rate < 600 || w.screen.height / rate < 600))
			browser.phone = true;

		browser[browser.agent] = true;
		browser[browser.agent + browser.ver] = true;

		var vendor = browser.webkit ? 'webkit' : browser.gecko ? 'Moz' : browser.presto ? 'O' : (browser.trident && browser.ver > 9) ? 'ms' : '';
		if ((vendor + 'Transform') in w.document.documentElement.style)
			browser.hasTransform = true;

		if (browser.webkit && 'WebKitCSSMatrix' in w && 'm11' in new WebKitCSSMatrix())
			browser.has3d = true;

		if (w.devicePixelRatio > 1)
			browser.retina = true;

		browser.touch = ("createTouch" in w.document);

		return browser;
	}

	var d = device(window);
	d.newDevice = device;
	return d;
});
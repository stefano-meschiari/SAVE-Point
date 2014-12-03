define([ "device" ], function (d) {

	describe("device", function () {
		var device;
		var w;

		describe("ie6", function () {

			before(function () {
				w = {
					ActiveXObject: true,
					screen: {
						width: 1440,
						height: 900
					},
					document: {
						documentElement: {
							clientWidth: 1440,
							style: {}
						}
					},
					navigator: {
						userAgent: "Mozilla/5.0 (Windows; U; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)",
						platform: "Win32",
						appVersion: "4.0 (compatible; MSIE 6.0;)"
					}
				};
				device = d.newDevice(w);
			});

			after(function () {
				w = {};
			});

			it("engine should be 'trident'", function () {
				assert.equal(device.engine, 'trident');
			});

			it("trident should be true", function () {
				assert.equal(device.trident, true);
			});

			it("agent should be 'msie'", function () {
				assert.equal(device.agent, 'msie');
			});

			it("version should be 6", function () {
				assert.equal(device.ver, 6);
			});

			it("os should be 'Windows'", function () {
				assert.equal(device.os, 'Windows');
			});

			it("Windows should be true", function () {
				assert.equal(device.Windows, true);
			});

			it("desktop should be true", function () {
				assert.equal(device.desktop, true);
			});

			it("msie should be true", function () {
				assert.equal(device.msie, true);
			});

			it("msie6 should be true", function () {
				assert.equal(device.msie6, true);
			});
		});

		describe("ie7", function () {

			before(function () {
				w = {
					ActiveXObject: true,
					XMLHttpRequest: true,
					screen: {
						width: 1440,
						height: 900
					},
					document: {
						documentElement: {
							clientWidth: 1440,
							style: {}
						}
					},
					navigator: {
						userAgent: "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E)",
						platform: "Win32",
						appVersion: "4.0 (compatible; MSIE 7.0; Windows NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E)"
					}
				};
				device = d.newDevice(w);
			});

			after(function () {
				w = {};
			});

			it("engine should be 'trident'", function () {
				assert.equal(device.engine, 'trident');
			});

			it("trident should be true", function () {
				assert.equal(device.trident, true);
			});

			it("agent should be 'msie'", function () {
				assert.equal(device.agent, 'msie');
			});

			it("version should be 7", function () {
				assert.equal(device.ver, 7);
			});

			it("os should be 'Windows'", function () {
				assert.equal(device.os, 'Windows');
			});

			it("Windows should be true", function () {
				assert.equal(device.Windows, true);
			});

			it("desktop should be true", function () {
				assert.equal(device.desktop, true);
			});

			it("msie should be true", function () {
				assert.equal(device.msie, true);
			});

			it("msie7 should be true", function () {
				assert.equal(device.msie7, true);
			});

		});

	});

});



var device = require("../src/device");
var os = require("os");
var assert = require("assert");
require('console-colour')(String);

describe('device', function () {

	before(function () {
		assert.cpusEqual = function (cpu1, cpu2) {
			cpu1.forEach(function (v, index) {
				assert.equal(v.model, cpu2[index].model);
				assert.equal(v.speed, cpu2[index].speed);
			});
		};
	});

	it('device.tmpdir'.yellow + ' should equal to ' + ' os.tmpdir()'.yellow, function () {
		assert.equal(device.tmpdir, os.tmpdir ? os.tmpdir() : "There is no tmpdir found!");
	});

	it('device.endianness'.yellow + ' should equal to ' + ' os.endianness()'.yellow, function () {
		assert.equal(device.endianness, os.endianness ? os.endianness() : "There is no endianness found!");
	});

	it('device.hostname'.yellow + ' should equal to ' + ' os.hostname()'.yellow, function () {
		assert.equal(device.hostname, os.hostname ? os.hostname() : "There is no hostname found!");
	});


	it('device.type'.yellow + ' should equal to ' + ' os.type()'.yellow, function () {
		assert.equal(device.type, os.type ? os.type() : "There is no type found!");
	});

	it('device.platform'.yellow + ' should equal to ' + ' os.platform()'.yellow, function () {
		assert.equal(device.platform, os.platform ? os.platform() : "There is no platform found!");
	});

	it('device.arch'.yellow + ' should equal to ' + ' os.arch()'.yellow, function () {
		assert.equal(device.arch, os.arch ? os.arch() : "There is no arch found!");
	});

	it('device.release'.yellow + ' should equal to ' + ' os.release()'.yellow, function () {
		assert.equal(device.release, os.release ? os.release() : "There is no release found!");
	});

	it('device.loadavg'.yellow + ' should equal to ' + ' os.loadavg()'.yellow, function () {
		assert.deepEqual(device.loadavg, os.loadavg ? os.loadavg() : "There is no loadavg found!");
	});

	it('device.totalmem'.yellow + ' should equal to ' + ' os.totalmem()'.yellow, function () {
		assert.deepEqual(device.totalmem, os.totalmem ? os.totalmem() : "There is no totalmem found!");
	});

	it('device.networkInterfaces'.yellow + ' should equal to ' + ' os.networkInterfaces()'.yellow, function () {
		assert.deepEqual(device.networkInterfaces, os.networkInterfaces ? os.networkInterfaces() : "There is no networkInterfaces found!");
	});

	it('device.EOL'.yellow + ' should equal to ' + ' os.EOL'.yellow, function () {
		assert.deepEqual(device.EOL, os.EOL ? os.EOL : "There is no EOL found!");
	});

	it('device.cpus'.yellow + ' should equal to ' + ' os.cpus()'.yellow, function () {
		assert.cpusEqual(device.cpus, os.cpus ? os.cpus() : "There is no cpus found!");
	});

	it('device.getNetworkInterfaces'.yellow + ' should equal to ' + ' os.getNetworkInterfaces()'.yellow, function () {
		assert.deepEqual(device.getNetworkInterfaces, os.getNetworkInterfaces ? os.getNetworkInterfaces() : "There is no getNetworkInterfaces found!");
	});

	it('device.tmpDir'.yellow + ' should equal to ' + ' os.tmpDir()'.yellow, function () {
		assert.deepEqual(device.tmpDir, os.tmpDir ? os.tmpDir() : "There is no tmpDir found!");
	});

});
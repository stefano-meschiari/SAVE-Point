var device = require("../src/device");

var tmpdir = device.tmpdir;
console.log("tmpdir:",tmpdir);

var endianness = device.endianness;
console.log("endianness:",endianness);

var hostname = device.hostname;
console.log("hostname:",hostname);

var type = device.type;
console.log("type:",type);

var platform = device.platform;
console.log("platform:",platform);

var arch = device.arch;
console.log("arch:",arch);

var release = device.release;
console.log("release:",release);

var uptime = device.uptime;
console.log("release:",release);

var loadavg = device.loadavg;
console.log("loadavg:",loadavg);

var totalmem = device.totalmem;
console.log("totalmem:",totalmem);

var cpus = device.cpus;
console.log("cpus:",cpus);

var networkInterfaces = device.networkInterfaces;
console.log("networkInterfaces:",networkInterfaces);

var EOL = device.EOL;
console.log("EOL:",EOL);

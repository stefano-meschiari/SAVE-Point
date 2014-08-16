"use strict";

var Units = {};
Units.AU = 1.4959787e13;
Units.MSUN = 1.98892e33;
Units.MJUP = 1.8986e30;
Units.MEARTH = 5.97219e27;
Units.RJUP = 7.1e9;
Units.RSUN = 6.96e10;
Units.REARTH = 6.3e8;

Units.GGRAV = 6.67384e-8;
Units.MIN_DISTANCE = 300 * Units.RJUP/Units.AU;

Units.DAY = 8.64e4;
Units.TWOPI = 6.2831853072e+00;
Units.SQRT_TWOPI = 2.5066282746e+00;
Units.YEAR = 31556926.;

Units.RUNIT = Units.AU;
Units.MUNIT = Units.MSUN;
Units.TUNIT = Units.DAY;

Units.K2 = ((Units.GGRAV * Units.MUNIT * Units.TUNIT * Units.TUNIT) / (Units.RUNIT*Units.RUNIT*Units.RUNIT));

Units.update = function() {
    Units.K2 = ((Units.GGRAV * Units.MUNIT * Units.TUNIT * Units.TUNIT) / (Units.RUNIT*Units.RUNIT*Units.RUNIT));
};

if (typeof(exports) !== 'undefined') {
    exports.Units = Units;
}


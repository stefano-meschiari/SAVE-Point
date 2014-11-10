"use strict";


// UI constants
var RUNNING = 0;
var PAUSED = 1;
var MENU = 2;
var ROTATABLE = 3;


// Colors
var COLOR_SUN_INNER = 'white';
var COLOR_SUN_OUTER = 'rgba(255, 254, 181, 1)';
var COLOR_SUN_OUTER2 = 'rgba(255, 254, 181, 0.8)';
var COLOR_SUN_OUTER3 = 'rgba(255, 254, 181, 0)';
var COLOR_SUN_HALO_INNER = 'rgba(200,200,0,0.5)';
var COLOR_SUN_HALO_OUTER = 'rgba(200,200,0,0.)';

var PLANET_COLORS = [base0c, base08, base09, base0a, base0e, base0d, base0b, base0f, base07, base0f];

var ORBIT_COLORS = _.map(PLANET_COLORS, function(color) {
    var c = new Color(color);
    return c.alpha(0.5).rgbString();
});

var COLOR_OUTLINE = 'rgba(255, 255, 255, 1)';
var COLOR_MESSAGE = base0a;

// Paper.js font styles

var FONT_MESSAGE = {
    fontFamily: "Dosis",
    fontSize: "40px",
    fontWeight: 'bold'
};

// Templates

"use strict";


// UI constants
var RUNNING = "running";
var PAUSED = "paused";
var MENU = "menu";
var ROTATABLE = "rotatable";
var TITLE = "title";

// Paper.js font styles

var FONT_MESSAGE = {
    fontFamily: "Dosis",
    fontSize: "40px",
    fontWeight: 'bold'
};

// Colors
var COLOR_SUN_INNER = 'white';
var COLOR_SUN_OUTER = 'rgba(255, 254, 181, 1)';
var COLOR_SUN_OUTER2 = 'rgba(255, 254, 181, 0.8)';
var COLOR_SUN_OUTER3 = 'rgba(255, 254, 181, 0)';
var COLOR_SUN_HALO_INNER = 'rgba(200,200,0,0.5)';
var COLOR_SUN_HALO_OUTER = 'rgba(200,200,0,0.)';

var COLOR_OUTLINE = 'rgba(255, 255, 255, 1)';
var COLOR_MESSAGE = base0a;


var Colors = {
    cyan: base0c,
    red: base08,
    orange: base09,
    gold: base0a,
    blue: base0e,
    green: base0d,
    accent: 'rgb(102, 204, 255)',
    white: 'white',
    force: 'rgba(214, 197, 0, 1)',
    darkGlass: 'rgba(140, 140, 140, 0.4)',
    glass: 'rgba(140, 140, 140, 0.2)'    
};

(function() {
    var s = "<style>\n";
    _.each(Colors, function(value, key) {
        s += ".color-" + key + " { color: " + value + "}\n";
        s += ".shadow-color-" + key + " { text-shadow: 0px 0px 3px " + value + "}\n";
    });
    $("head").append(s);
})();

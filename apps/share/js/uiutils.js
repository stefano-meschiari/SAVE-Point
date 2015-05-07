"use strict";

var UIUtils = (function() {
    var touchDevice = device.tablet() || device.mobile();
    
    var mappings = (function() {
        var t = {};
        t['word-tap'] = ['tap', 'click'];
        t['word-finger'] = ['finger', 'mouse'];
        return t;
    })();
    
    return {
        bootstrap: function() {
            _.each(mappings, function(warr, spanClass) {
                console.log("." + spanClass);
                $("." + spanClass).text(touchDevice ? warr[0] : warr[1]);
            });
        },
        touchDevice: touchDevice,
        clickEvent: (touchDevice ? "touchstart" : "click")
    };    
})();

$(window).load(UIUtils.bootstrap);

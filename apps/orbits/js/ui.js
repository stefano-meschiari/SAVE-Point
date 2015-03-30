"use strict";

var UI = (function() {

    
    
    // Init tooltips
    if (device.desktop()) {
        $("[data-tooltip-content]").each(function() {
            $(this).attr('data-uk-tooltip', $(this).attr('data-tooltip-content'));
        });
    }

    $("#app-menu-map-container").on('touchstart', function() {});

    $(document).ready(function() {
        if (device.ios() || device.mobile()) {
            setInterval(function() { if (window.UI.scrollToTop) window.scrollTo(0, 0); }, 500);
        }
        if (device.ios() || device.mobile()) {
            var start = 0;
            document.getElementById('app-menu-map-container').addEventListener('touchstart', function(e) {
                start = this.scrollTop + event.touches[0].pageY;
            });
            document.getElementById('app-menu-map-container').addEventListener('touchmove', function(e) {
                this.scrollTop = start - event.touches[0].pageY;
            });
            
        }
    });

    if (IS_KIOSK) {
        var timer;
        var setupTimer = function() {
            if (timer)
                window.clearTimeout(timer);
            console.log("Starting timer.");
            timer = _.delay(function() {
                window.location.href = "/screensaver/";
            }, 60000);
        };
        setupTimer();
        $(document).on("touchstart touchmove", setupTimer);
    }

    window.onfocus = function() {
        app.set('alive', true);
    };

    window.onblur = function() {
        app.set('alive', false);
    };
    
    var touchDevice = device.tablet() || device.mobile();
    return {
        touchDevice: touchDevice,
        scrollToTop: true,
        clickEvent: (touchDevice ? "touchstart" : "click"),

        makeEventTable: function(table) {
            if (!touchDevice)
                return table;
            
            var ret = {};

            _.each(table, function(value, key) {
                ret[key.replace("click", "touchstart")] = value;
            });

            return ret;
        },

        animate: function(el, animation) {
            animation = animation || 'shake';
            var $el = $(el);
            $el.removeClass('uk-animation-' + animation);
            _.defer(function() {
                $el.addClass('uk-animation-' + animation);
            });
        }
        
    };
})();


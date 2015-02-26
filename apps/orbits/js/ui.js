"use strict";

(function() {

    // Init tooltips
    if (device.desktop()) {
        $("[data-tooltip-content]").each(function() {
            $(this).attr('data-uk-tooltip', $(this).attr('data-tooltip-content'));
        });
    }

    $("#app-menu-map-container").on('touchstart', function() {});

    $(document).ready(function() {
        if (device.ios() || device.mobile()) {
            setInterval(function() { window.scrollTop(0, 0); }, 500);
        }
        if (device.ios() || device.mobile()) {
            var start = 0;
            document.getElementById('app-menu-map-container').addEventListener('touchstart', function(e) {
                start = this.scrollTop + event.touches[0].pageY;
                event.preventDefault();
            });
            document.getElementById('app-menu-map-container').addEventListener('touchmove', function(e) {
                this.scrollTop = start - event.touches[0].pageY;
                event.preventDefault();
            });
            
        }
    });    
})();

"use strict";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var Slides = (function() {

    var currentSlide = -1;
    var delay = 10000;
    return {
        run: function(slide) {
            _.delay(function() {
                if (slide === undefined) {
                    slide = currentSlide;
                    while (slide == currentSlide) {                        
                        slide = getRandomInt(-10, SLIDES-1);
                        if (slide < 0)
                            slide = 0;
                    }
                }
                $(".slide-expanded").removeClass("slide-expanded");
                $("#slide" + slide).addClass("slide-expanded");
                currentSlide = slide;
                Slides.run();
            }, (currentSlide < 0 ? 0 : delay));
        },
        clicked: function() {
            location.href = '/?login=kiosk';
        }
    };
    
})();

$("#slide0").addClass("slide-expanded");

$(document).ready(function() {
    Slides.run(0);

    $("#screen").on("mousedown", Slides.clicked);
    $("#screen").on("touchstart", Slides.clicked);
     
    
});

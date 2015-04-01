
"use strict";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var Slides = (function() {

    var currentSlide = -1;
    var delay = 15000;
    var rate = 40/1000;
    var timer;
    
    return {
        anim: function() {
            clearInterval(timer);
            
            if (SLIDES[currentSlide].fixed) {
                $("#img" + currentSlide).css("max-width", "100%");
                return;
            } else {
                var $img = $("#img" + currentSlide);
                var width = $img[0].naturalWidth;
                var height = $img[0].naturalHeight;
                var r = width/height;
                $img.attr("style", "");
                console.log(width, height, window.innerWidth, window.innerHeight);
                var prop;
                var wdim;
                $img.css({ top: 0, left: 0});

                

                if (window.innerWidth / r > window.innerHeight) {
                    $img.attr('width', window.innerWidth);
                    $img.attr('height', (window.innerWidth / r)|0);
                } else {
                    $img.attr('width', (window.innerHeight * r) | 0);
                    $img.attr('height', window.innerHeight);
                }
                console.log($img.attr('width'), $img.attr('height'));


                if ($img.attr('width') > window.innerWidth) {
                    prop = 'x';
                    wdim = window.innerWidth - $img.attr('width');
                } else {
                    prop = 'y';
                    wdim = window.innerHeight - $img.attr('height');
                }

                var anim = {};
                anim[prop] = wdim;
                $img.transition(anim, delay);
            }
        },
        run: function(slide) {
            _.delay(function() {
                if (slide === undefined) {
                    slide = currentSlide;
                    while (slide == currentSlide) {                        
                        slide = getRandomInt(-10, SLIDES.length-1);
                        if (slide < 0)
                            slide = 0;
                    }
                }

                currentSlide = slide;
                $(".slide-expanded").removeClass("slide-expanded");
                Slides.anim();                
                $("#slide" + slide).addClass("slide-expanded");

                Slides.run();

                
            }, (currentSlide < 0 ? 0 : delay));
        },
        clicked: function() {
            _.delay(function() {
                location.href = '/?login=kiosk';
            }, 500);
            $("#screen").addClass("expanded");
        }
    };
    
})();

$("#slide0").addClass("slide-expanded");

$(document).ready(function() {
    if (_.parameter("showall")) {
        $("body").addClass("show-overflow");       
    } else {
        Slides.run(0);
        if (!_.parameter("noredirect")) {
            $("#screen").on("mousedown", Slides.clicked);
            $("#screen").on("touchstart touchmove touchend", Slides.clicked);
        }
    }    
});


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
            console.log(currentSlide);
            if (SLIDES[currentSlide].fixed) {
                $("#img" + currentSlide).css("max-width", "100%");
                return;
            } else {
                var $img = $("#img" + currentSlide);
                if ($img.length == 0)
                    return;
                var width = $img[0].naturalWidth;
                var height = $img[0].naturalHeight;
                var r = width/height;
                $img.attr("style", "");
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
                if (Slides.canReset)
                    window.location.href = '/screensaver/';
                    
                if (slide === undefined) {
                    slide = currentSlide;
                    while (slide == currentSlide) {                        
                        slide = getRandomInt(-10, SLIDES.length + 100);
                        if (slide < 0)
                            slide = 0;
                        if (slide >= SLIDES.length)
                            slide = SLIDES.length - 1;
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
            }, 200);
            $("#screen").addClass("expanded");
        }
    };
    
})();

$("#slide0").addClass("slide-expanded");

$(document).ready(function() {
    if (_.parameter("showall")) {
        $("body").addClass("show-overflow");       
    } else {
        $.get("/spc/hiscore.php?action=get", function(data) {
            var div = "<div id='slide11' class='slide'><div class='slide-title'><strong>Super Planet Crash</strong><div class='attrib'>High Scores</div></div>";
            div += "<table><tr><th>Name</th><th>Points</th></tr>";
            data = JSON.parse(data);
            var i = 0;

            _.each(data, function(row) {
                var points = +row['points'];
                if (points === 0 || isNaN(points))
                    return;
                div += "<tr><td>" + row['name'] + "</td><td>" + row['points'] + "</td></tr>";
                i++;
                if (i > 10)
                    return;
            });

            div += "</table></div>";
            
            $(".slide-container").append($(div));
            SLIDES.push({});
        }).done(function() {
            Slides.run(0);
        }).fail(function() {
            Slides.run(0);
        });
        
        if (!_.parameter("noredirect")) {
            $("#screen").on("mousedown", Slides.clicked);
            $("#screen").on("touchstart touchmove touchend", Slides.clicked);

            _.delay(function() {
                Slides.canReset = true;
            }, 120000);
            
        }
    }    
});

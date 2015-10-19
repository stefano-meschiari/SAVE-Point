
"use strict";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var Slides = (function() {

    var currentSlide = -1;
    var delay = 8000;
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
                if (slide !== undefined)
                    currentSlide = slide;
                else
                    currentSlide = currentSlide + 1;

                if (currentSlide == SLIDES.length) {
                    location.reload(true);
                }
                
                $(".slide-expanded").removeClass("slide-expanded");
                Slides.anim();                
                $("#slide" + currentSlide).addClass("slide-expanded");
                Slides.run();
                
            }, (currentSlide < 0 ? 0 : delay));
        },
        clicked: function() {
            if (window.DINNER)
                return;
            _.delay(function() {
                location.href = '/?login=kiosk';
            }, 200);
            $("#screen").addClass("expanded");
            return false;
        }
    };
    
})();

$("#slide0").addClass("slide-expanded");

$(document).ready(function() {
    if (_.parameter("showall")) {
        $("body").addClass("show-overflow");       
    } else if (_.parameter("dinner")) {
        window.DINNER = true;
        Slides.run(1);
    } else {
        $.get("/spc/hiscore.php?action=get", function(data) {
            var div = "<div id='slide11' class='slide'><div class='slide-title'><strong>Super <span class='base0C'>Planet </span><span class='base0A'>Crash</span></strong><div class='attrib'>High Scores</div></div>";
            div += "<table><tr><th>Name</th><th>Points</th></tr>";
            try {
                data = JSON.parse(data);
            } catch (e) {
                Slides.run(0);
                return;
            }

            _.each(data, function(row, i) {
                var points = +row['points'];
                if (points === 0 || isNaN(points) || i >= 8)
                    return;
                div += "<tr><td>" + row['name'] + "</td><td>" + row['points'] + "</td></tr>";

            });

            div += "</table></div>";
            
            $(".slide-container").append($(div));
            SLIDES.push({});
            Slides.run(0);
        }).fail(function() {
            Slides.run(0);
        });
        
        if (!_.parameter("noredirect")) {
            $("#screen").on("mousedown", Slides.clicked);
            $("#screen").on("touchstart touchend", Slides.clicked);            
        }
    }    
});

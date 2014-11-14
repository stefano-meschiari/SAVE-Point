draw.js
lynda.com, jquery tutorial

    function step() {
        speed1.update();
	speed2.update();
	speed3.update();
	speed4.update();

        if (Math.abs(spring.v0) < 1e-2 &&
	    Math.abs(spring2.v0) < 1e-2) {
            $("#start-button").text('Start');
            $("#start-button").attr('disabled', false);
            return;
        }
        
        window.requestAnimationFrame(step);
    }
    
    window.requestAnimationFrame(step);

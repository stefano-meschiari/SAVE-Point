"use strict";

// Spring with friction
function Spring() {
    this.k = 10;
    this.f = 0.4;
    this.x0 = 500;
    this.x_resting = 400;
    this.v0 = 0;
    this.dt = 0.02;

    this.update = function() {
        var a = - this.k * (this.x0-this.x_resting) - this.f * this.v0;
        
        this.x0 = this.x0 + this.v0 * this.dt;
        this.v0 = this.v0 + a * this.dt;
        
        $("#spring").css('width', this.x0);
    };
};

$("#start-button").on("click", function() {
    $("#start-button").attr('disabled', true);
    $("#start-button").text("Waiting...");

    var spring = new Spring();

    function step() {
        spring.update();

        if (Math.abs(spring.v0) < 1e-2) {
            $("#start-button").text('Start');
            $("#start-button").attr('disabled', false);
            return;
        }
        
        window.requestAnimationFrame(step);
    }
    
    window.requestAnimationFrame(step);

});

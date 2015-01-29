"use strict";
return;

$("#sidebar").append('<button id="debug-get-stars" class="btn btn-sm btn-danger">get all stars</button>', [
    '<button id="debug-reset-missions" class="btn btn-sm btn-danger">reset missions</button>',
    '<button id="debug-win1" class="btn btn-sm btn-danger">win 1 star</button>',
    '<button id="debug-win2" class="btn btn-sm btn-danger">win 2 stars</button>',
    '<button id="debug-win3" class="btn btn-sm btn-danger">win 3 stars</button>',
    '<button id="debug-lose" class="btn btn-sm btn-danger">lose</button>']);


$("#debug-get-stars").click(function() {
    var missions = app.get('missions');

    missions.each(function(mission) {
        mission.set('stars', mission.get('value') || 3);
        mission.set('completed', true);
    });
    
    app.menu();
});

$("#debug-reset-missions").click(function() {
    var missions = app.get('missions');

    missions.each(function(mission) {
        mission.set('stars', 0);
        mission.set('completed', false);
    });
    
    app.menu();
});

$("#debug-win1").click(function() { app.trigger('win1 win'); });
$("#debug-win2").click(function() { app.trigger('win2 win'); });
$("#debug-win3").click(function() { app.trigger('win3 win'); });
$("#debug-lose").click(function() { app.trigger('lose'); });

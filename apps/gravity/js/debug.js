"use strict";

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

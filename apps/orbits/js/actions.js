"use strict";

var Actions = _.extend({}, Backbone.Events);

Actions.listenTo(app, 'start', function() {
    var mission = app.mission();

    this.actions = mission.get('trialActions');
    this.durations = mission.get('trialDurations');
    this.stars = mission.get('trialStars');
    this.data = mission.get('trialData');
    mission.get('trialData').push({
        userAgent: navigator.userAgent
    });
    mission.get('trialDates').push(new Date());
});

Actions.listenTo(app, 'win', function() {
    this.stars.push(app.stars());
    this.durations.push(app.elapsedTime(true));
});

Actions.listenTo(app, 'lose', function() {
    this.stars.push(0);
    this.durations.push(app.elapsedTime(true));
});

_.each(['planet:drag', 'planet:dragvelocity'], function(action) {
    Actions.listenTo(app, action, function() {
        if (! app.get('state') == PAUSED)
            return;
        if (! app.get('interactive'))
            return;
        if (Actions.actions.length > 0 && Actions.actions[Actions.actions.length-1].action == action)
            return;
        
        Actions.actions.push({
            action: action,
            time: new Date()
        });
    });
});

_.each(['addPlanet'], function(action) {
    Actions.listenTo(app, action, function() {
        if (! app.get('state') == PAUSED)
            return;

        if (! app.get('interactive'))
            return;
        Actions.actions.push({
            action: action,
            time: new Date()
        });
    });
});


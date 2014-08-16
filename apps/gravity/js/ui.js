"use strict";

var AppState = Backbone.Model.extend({
    defaults: {
        currentMission: 0,
        currentText:0,
        state:RUNNING,
        nplanets: 0,
        time:0,
        deltat: 1
    },

    toggleState: function() {
        this.set('state', (this.get('state') == RUNNING ? PAUSED : RUNNING));
    },

    sync: function(method, model, options) {
        options.dataType = "json";
        return $.ajax("app.json", options);
    },

    addPlanet: function(coords) {
        this.ctx.x.push(coords[0], coords[1], 0);
        this.ctx.v.push(0.5, 0, 0);
        this.ctx.M.push(0);
        console.log('Added planet');
        this.set('nplanets', this.get('nplanets')+1);
    },

    coords: function() {
        return this.ctx.x;
    },

    setPlanetCoords: function(i, coords) {
        this.ctx.x[(i+1)*NPHYS+X] = coords[0];
        this.ctx.x[(i+1)*NPHYS+Y] = coords[1];
        this.ctx.x[(i+1)*NPHYS+Z] = coords[2];        
    },

    vels: function() {
        return this.ctx.v;
    },
    
    tick: function() {
        var t = this.get('time');
        var deltat = this.get('deltat');
        this.ctx.t = t;
        Physics.leapfrog(t+deltat, this.ctx);
        
        this.set('time', t+deltat);
    },

    initialize: function() {
        this.ctx = {M:[1], x:[0, 0, 0], v:[0, 0, 0]};
    }
});

var app = new AppState();

var AppView = Backbone.View.extend({
    el: $("#app"),
    
    events: {
        "click #menu": function(e) { $("#sidebar").toggleClass("expanded"); }
    },

    initialize: function() {
        var self = this;
        self.listenTo(self.model, 'change:state', self.toggleState);
        self.listenTo(self.model, 'change:currentMission', self.renderMissions);
        self.listenTo(self.model, 'change:missions', self.renderMissions);
        self.listenTo(self.model, 'change:time', _.throttle(self.renderInfo, 500));
        self.model.fetch();
    },

    MISSION_COMPLETED: "mission-completed",
    MISSION: "mission",
    MISSION_ACTIVE: "mission-active",
    MISSION_TEMPLATE: _.template('<div class="<%= type %>"><div class="mission-symbol"></div><div class="mission-label"><%= label %></div><div class="clear"></div></div>'),
    
    renderMissions: function() {
        var current = this.model.get('currentMission');
        var missions = this.model.get('missions');
        var $div = $('<div id="missions"></div>');
        
        for (var i = 0; i < missions.length; i++) {
            var type = (current == i ? this.MISSION_ACTIVE : (i < current ? this.MISSION_COMPLETED : this.MISSION));
            $div.append(this.MISSION_TEMPLATE({ type: type, label: missions[i].title }));
        }

        $("#missions").replaceWith($div);
    },

    renderInfo: function() {
        $("#time").text(this.model.get('time'));
    },
    
    toggleState: function() {
        
    },

    canvasMouseDown: function(e) {
        if (app.get('state') == RUNNING) {
            app.toggleState();
        } else {
            app.addPlanet(e.coords);
        }
    }
});

var appView = new AppView({ model: app });


$(document).ready(function() {
});


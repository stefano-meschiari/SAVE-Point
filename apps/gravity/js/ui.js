"use strict";

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

var AppState = Backbone.Model.extend({
    defaults: {
        currentMission: 0,
        currentText:0,
        state:PAUSED,
        nplanets: 0,
        time:0,
        deltat: 1,
        maxPlanets: 1
    },

    toggleState: function() {
        this.set('state', (this.get('state') == RUNNING ? PAUSED : RUNNING));
    },

    sync: function(method, model, options) {
        options.dataType = "json";
        return $.ajax("app.json", options);
    },

    addPlanet: function(coords) {
        if (this.get('nplanets') == this.get('maxPlanets'))
            return;
        this.ctx.x.push(coords[0], coords[1], 0);
        this.ctx.v.push(Math.sqrt(K2), 0, 0);
        this.ctx.M.push(0);
        this.set('nplanets', this.get('nplanets')+1);

    },

    coords: function() {
        return this.ctx.x;
    },

    setCoords: function(i, coords) {
        this.ctx.x[(i+1)*NPHYS+X] = coords[0];
        this.ctx.x[(i+1)*NPHYS+Y] = coords[1];
        this.ctx.x[(i+1)*NPHYS+Z] = coords[2];
        this.trigger("change:coords");
    },

    vels: function() {
        return this.ctx.v;
    },

    setVels: function(i, vels) {
        this.ctx.v[(i+1)*NPHYS+X] = vels[0];
        this.ctx.v[(i+1)*NPHYS+Y] = vels[1];
        this.ctx.v[(i+1)*NPHYS+Z] = vels[2];
        this.trigger("change:vels");        
    },
    
    tick: function() {
        var t = this.get('time');
        var deltat = this.get('deltat');
        this.ctx.t = t;        
        Physics.leapfrog(t+deltat, this.ctx);
        this.set('time', t+deltat);
        this.trigger("change:coords");
        this.trigger("change:vels");
    },

    initialize: function() {
        this.ctx = {M:[1], x:[0, 0, 0], v:[0, 0, 0], dt: 0.25};
    }
});

var app = new AppState();

var AppView = Backbone.View.extend({
    el: $("#app"),
    
    events: {
        "click #menu": function() { $("#sidebar").toggleClass("expanded"); },
        "click #help": function() { $("#help-bottom").toggleClass("expanded"); }
    },

    initialize: function() {
        var self = this;
        self.listenTo(self.model, 'change:state', self.toggleState);
        self.listenTo(self.model, 'change:currentMission', self.renderMissions);
        self.listenTo(self.model, 'change:missions', self.renderMissions);
        self.listenTo(self.model, 'change:nplanets change:time change:coords change:vels', _.throttle(self.renderInfo, 500));
        self.model.set(APP_CFG);
        self.renderInfo();

        self.validateTimer = setInterval(_.bind(self.validate, self), 1000);
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

        $("#help-text").html(missions[current].text);
    },

    renderInfo: function() {
        $("#time").text(this.model.get('time') + " days");
        if (app.get('nplanets') > 0) {
            var coords = app.coords();
            var vels = app.vels();
            
            var r = Math.sqrt((coords[X]-coords[NPHYS+X])*(coords[X]-coords[NPHYS+X]) +
                              (coords[Y]-coords[NPHYS+Y])*(coords[Y]-coords[NPHYS+Y]) +
                              (coords[Z]-coords[NPHYS+Z])*(coords[Z]-coords[NPHYS+Z]));

            var v = Math.sqrt((vels[X]-vels[NPHYS+X])*(vels[X]-vels[NPHYS+X]) +
                              (vels[Y]-vels[NPHYS+Y])*(vels[Y]-vels[NPHYS+Y]) +
                              (vels[Z]-vels[NPHYS+Z])*(vels[Z]-vels[NPHYS+Z]));
            
            $("#distance").html((r * Units.RUNIT / (1e13)).toFixed(2) + " x 10<sup>8</sup> km");
            $("#speed").text((v * Units.RUNIT / Units.TUNIT / (1e5)).toFixed(2) + " km/s");
        }
    },

    toggleState: function() {
        
    },

    canvasMouseDown: function(e) {
        if (app.get('state') == RUNNING) {
            app.toggleState();
        } else {
            app.addPlanet(e.coords);
        }
    },

    validate: function() {
        if (app.get('state') != RUNNING)
            return;

        var f = RULES_FN[app.get('currentMission')];
    }
});

var appView = new AppView({ model: app });


$(document).ready(function() {
});


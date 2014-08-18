/*
 * This file contains the Gravity application code, both the model singleton ("app") and
 * the main view. The drawing code is contained in draw.js.
 *
 * The application uses (loosely) the Backbone.js paradigms of model and view. The model
 * encapsulates the state of the application (e.g. position and velocity of the bodies,
 * current time, current mission, etc.), while several views subscribe to events fired by
 * the model in order to be notified whenever any property of the model is changed.
 */

"use strict";

/*
 * The app state model. The properties of the model defined in defaults are augmented
 * by the properties in app.yaml, and inserted into the APP_CFG dictionary by the backend.
 *
 */
var AppState = Backbone.Model.extend({
    defaults: {
        // start with the first mission
        currentMission: 0,
        // start off in a PAUSED state (can either be PAUSED or RUNNING); when PAUSED,
        // the user can add planets, drag them, and change their velocity vector.
        // When RUNNING, time is flowing and the planet orbits the central star.
        state:PAUSED,
        // start with no planets
        nplanets: 0,
        // start at t = 0 days
        time:0,
        // each frame corresponds to these many days
        deltat: 1,
        // maximum number of planets for the current mission
        maxPlanets: 1,
        // initial position of the star (AU/day). The vector contains the 3
        // coordinates for each body, (x^0, y^0, z^0, x^1, y^1, z^1, ...),
        // so that the are 3*nplanets components.
        position: [0, 0, 0],
        // initial velocity of the star (AU/day). The vector contains the 3
        // velocity components for each body, (v_x^0, v_y^0, v_z^0, v_x^1, v_y^1, v_z^1, ...),
        // so that the are 3*nplanets components.
        velocity: [0, 0, 0],
        // initial mass of the star (MSUN). The vector contains the masses of
        // all the bodies in the system.
        masses: [1]
    },

    /*
     * Toggles the state of the application between RUNNING and PAUSED.
     */
    toggleState: function() {
        this.set('state', (this.get('state') == RUNNING ? PAUSED : RUNNING));
    },

    /*
     * Syncs the state of the model with the server. Not implemented.
     */     
    sync: function(method, model, options) {
        throw new Error("TODO: Sync method for AppState model.");
        // options.dataType = "json";
        // return $.ajax("app.json", options);
    },

    /*
     * Adds a new planet at the specified position, in AU.
     * The initial speed is sqrt(K2) in internal units (~30 km/s),
     * while the initial mass is 0.
     */
    addPlanet: function(x) {
        // Return if there are already more planets than allowed.
        if (this.get('nplanets') == this.get('maxPlanets'))
            return;

        // Append position and default velocity & mass to the
        // respective arrays, then fire the change events.
        var position = this.get('position');
        var velocity = this.get('velocity');
        var masses = this.get('masses');
        
        position.push(x[0], x[1], 0);
        velocity.push(Math.sqrt(K2), 0, 0);
        masses.push(0);
        this.set('nplanets', this.get('nplanets')+1);
        this.trigger("change:position change:velocity change:masses");
    },

    /*
     * Sets the position for the i-th body (the first planet is the 0-th body).
     */
    setPositionForBody: function(i, x) {
        var position = this.get('position');
        position[(i+1)*NPHYS+X] = x[0];
        position[(i+1)*NPHYS+Y] = x[1];
        position[(i+1)*NPHYS+Z] = x[2];
        this.trigger("change:position");
    },

    /*
     * Sets the velocity for the i-th body.
     */
    setVelocityForBody: function(i, v) {
        var velocity = this.get('velocity');
        velocity[(i+1)*NPHYS+X] = v[0];
        velocity[(i+1)*NPHYS+Y] = v[1];
        velocity[(i+1)*NPHYS+Z] = v[2];
        this.trigger("change:velocity");        
    },

    /*
     * Makes the system advance by deltat, updating the position and velocities
     * of all bodies.
     */
    tick: function() {
        var t = this.get('time');
        var deltat = this.get('deltat');
        this.ctx.t = t;
        this.ctx.x = this.get('position');
        this.ctx.v = this.get('velocity');
        this.ctx.M = this.get('masses');
        
        Physics.leapfrog(t+deltat, this.ctx);
        this.set('time', t+deltat);
        this.trigger("change:position");
        this.trigger("change:velocity");
    },

    /*
     * Initializes the model, by creating a "context" object. The context
     * object is used by the leapfrog function.
     */
    initialize: function() {
        this.ctx = {M:this.get('masses'), x: this.get('position'), v:this.get('velocity'), dt: 0.25 };
    }
});

// Creates the global singleton object that contains the application state.
var app = new AppState();

/*
 * The top-level view object. It manages updates to the interface due to model events,
 * and binds to events within the #app div element (e.g. button clicks).
 */
var AppView = Backbone.View.extend({
    // Top-level container
    el: $("#app"),

    // Events table mapping button to UI updates.
    events: {
        "click #menu": function() { $("#sidebar").toggleClass("expanded"); },
        "click #help": function() { $("#help-bottom").toggleClass("expanded"); }
    },

    // Binds functions to change events in the model.
    initialize: function() {
        var self = this;
        
        self.listenTo(self.model, 'change:state', self.toggleState);
        self.listenTo(self.model, 'change:currentMission', self.renderMissions);
        self.listenTo(self.model, 'change:missions', self.renderMissions);
        self.listenTo(self.model, 'change:nplanets change:time change:position change:velocity', _.throttle(self.renderInfo, 500));

        // APP_CFG is an object created statically by the backend and inserted in
        // a top-level <script> tag. This is done so that the model does not have to
        // fetch it asynchronously from a .json file.
        // APP_CFG replicates the configuration options contained in app.yaml: e.g.,
        // mission text and objectives.
        self.model.set(APP_CFG);

        // Renders the information table on the top-right corner.
        self.renderInfo();

        // A timer that checks whether a mission has been completed, by running the
        // validate function.
        self.validateTimer = setInterval(_.bind(self.validate, self), 1000);
    },

    MISSION_COMPLETED: "mission-completed",
    MISSION: "mission",
    MISSION_ACTIVE: "mission-active",
    
    MISSION_TEMPLATE: _.template('<div class="<%= type %>"><div class="mission-symbol"></div><div class="mission-label"><%= label %></div><div class="clear"></div></div>'),

    /*
     * Renders the mission list in the left sidebar. There are three states for the missions:
     * "MISSION" (a mission that has not been completed yet), "MISSION_ACTIVE" (the current mission),
     * and "MISSION_COMPLETED" (a completed mission).
     *
     * Each one corresponds to a different CSS class. The #missions div is filled with the titles
     * and icons of the missions.
     */
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

    /*
     * Fills the table on the top-right hand side with the relevant information. renderInfo is
     * throttled so it is only updated once per second (or so).
     *
     * For now, it displays time (in days), the distance from the central star (in 10^8 km),
     * and the speed (in km/s).
     */
    renderInfo: function() {
        $("#time").text(this.model.get('time') + " days");
        if (app.get('nplanets') > 0) {
            var position = app.get('position');
            var velocity = app.get('velocity');
            
            var r = Math.sqrt((position[X]-position[NPHYS+X])*(position[X]-position[NPHYS+X]) +
                              (position[Y]-position[NPHYS+Y])*(position[Y]-position[NPHYS+Y]) +
                              (position[Z]-position[NPHYS+Z])*(position[Z]-position[NPHYS+Z]));

            var v = Math.sqrt((velocity[X]-velocity[NPHYS+X])*(velocity[X]-velocity[NPHYS+X]) +
                              (velocity[Y]-velocity[NPHYS+Y])*(velocity[Y]-velocity[NPHYS+Y]) +
                              (velocity[Z]-velocity[NPHYS+Z])*(velocity[Z]-velocity[NPHYS+Z]));
            
            $("#distance").html((r * Units.RUNIT / (1e13)).toFixed(2) + " x 10<sup>8</sup> km");
            $("#speed").text((v * Units.RUNIT / Units.TUNIT / (1e5)).toFixed(2) + " km/s");
        }
    },

    toggleState: function() {
        
    },

    /*
     * Event forwarded from draw.js when the user clicks or taps on the canvas. If the current state is RUNNING,
     * then tapping anywhere will pause the app. Otherwise, add a new planet.
     */
    canvasMouseDown: function(e) {
        if (app.get('state') == RUNNING) {
            app.toggleState();
        } else {
            app.addPlanet(e.position);
        }
    },

    /*
     * Checks whether the mission's objective has been accomplished. The mission's objective is written into a
     * table of functions called RULES_FN, which is generated by the backend according to the "rules" sections in app.yaml.
     *
     * FIXME: Since teachers are supposed to be able to override the defaults & create their own activities/rules,
     * we *need* to make sure that rules are sanitized and cannot be used to run arbitrary JavaScript.
     */
    validate: function() {
        if (app.get('state') != RUNNING)
            return;

        var f = RULES_FN[app.get('currentMission')];
    }
});

// Singleton view object
var appView;

$(document).ready(function() {
    appView = new AppView({ model: app });
});


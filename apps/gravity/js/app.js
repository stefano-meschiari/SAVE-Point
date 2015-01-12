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

/* Read-only computed properties. */
Backbone.ROComputedModel = Backbone.Model.extend({
    /*
     * Enable computed, read-only properties
     */
    get: function(attr) {
        if (this.attributes[attr] !== undefined)
            return this.attributes[attr];
        else if (_.isFunction(this[attr]))
            return this[attr]();
        else 
            return this[attr];
    }    
});



/*
 * The mission model. 
 */
var Mission = Backbone.ROComputedModel.extend({
    defaults: {
        completed: false,
        elapsed: -1,
        elements: null,
        stars: 0,
        lastPlayed: null,
        name: ''
    }, 

    starsRepr: function() {
        var repr = "";
        var total = this.get('value') || 3;
        var stars = this.get('stars');
        for (var i = 0; i < stars; i++)
            repr += app.templates.FULL_STAR;
        for (i = stars; i < total; i++)
            repr += app.templates.EMPTY_STAR;
        return repr;
    },

    toJSON: function() {
        return _.pick(this.attributes, _.keys(this.defaults));
    }
});

/*
 * A collection of missions. This object takes care of synchronizing with the server.
 */
var MissionCollection = Backbone.Collection.extend({
    model: Mission    
});

/*
 * The app state model. The properties of the model defined in defaults are augmented
 * by the properties in app.yaml, and inserted into the APP_CFG dictionary by the backend.
 *
 */

var TYPE_STAR = 0;
var TYPE_PLANET = 1;
var TYPE_STAR_FIXED = 2;
var TYPE_PLANET_FIXED = 3;

var App = Backbone.ROComputedModel.extend({
    defaults: function() {
        return {
            // start with the first mission
            currentMission: 0,
            // start off in a PAUSED state (can either be PAUSED, RUNNING or MENU); when PAUSED,
            // the user can add planets, drag them, and change their velocity vector.
            // When RUNNING, time is flowing and the planet orbits the central star.
            state:PAUSED,
            // show orbit?
            showOrbit:false,
            // start time, used to calculate elapsed time
            userStartTime:new Date(),
            userEndTime:null,
            // start with no planets
            nplanets: 0,
            // start at t = 0 days
            time:0,
            // each frame corresponds to these many days
            deltat: 1.5,
            dt: 1.5,
            bodyTypes: [TYPE_STAR],
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
            masses: [1],
            // default mass of new objects
            defaultMass:0,
            // mission collection
            missions: null,
            // interactive?
            interactive: true,
            // invalid?
            invalid:false,
            // has a collision happened?
            collided:false,
            // physical vs cartoon sizes
            physicalSizes:false,
            // number of stars gained so far
            starsEarned:[],            
            maxAU: 1.5,
            minAU: 0.19
        };
    },

    components: {},
    
    /*
     * Toggles the state of the application between RUNNING and PAUSED.
     */
    toggleState: function() {
        var state = this.get('state');
        if (state == RUNNING)
            this.set('state', PAUSED);
        else if (state == PAUSED)
            this.set('state', RUNNING);
        else
            console.warn("app.toggleState() was used when state is ", state);
    },

    /*
     * Syncs the state of the model with the server. Not implemented.
     */     
    sync: function(method, model, options) {
        throw new Error("TODO: Sync method for App model.");        
    },

    /*
     * Adds a new planet at the specified position, in AU.
     * The initial speed is sqrt(K2) in internal units (~30 km/s),
     * while the initial mass is 0.
     */
    addPlanet: function(x) {
        // Return if there are already more planets than allowed.
        if (! this.ensureConstraints())
            return;

        // Append position and default velocity & mass to the
        // respective arrays, then fire the change events.
        var position = this.get('position');
        var velocity = this.get('velocity');
        var masses = this.get('masses');
        var types = this.get('bodyTypes');
        
        position.push(x[0], x[1], 0);
        types.push(TYPE_PLANET);
        
        var v = Math.sqrt(K2);
        velocity.push(v, 0, 0);
        masses.push(this.get('defaultMass'));
        this.ctx.elements = null;
        this.set('nplanets', this.get('nplanets')+1);
        this.ensureConstraintsForBody(this.get('nplanets')-1);        
        this.ctx.elements = null;
        this.trigger("change:position change:velocity change:masses addPlanet");
        Physics.barycenter(this.ctx);

    },

    /*
     * Sets the position for the i-th body (the first planet is the 0-th body).
     */
    setPositionForBody: function(i, x) {
        var position = this.get('position');
        position[(i+1)*NPHYS+X] = x[0];
        position[(i+1)*NPHYS+Y] = x[1];
        position[(i+1)*NPHYS+Z] = x[2];

        if (this.ensureConstraintsForBody(i))
            this.trigger('change:velocity');
        
        this.trigger("change:position");
        Physics.barycenter(this.ctx);

    },


    ensureConstraints:function() {
        var constraints = app.mission().get('constraints');
        if (!constraints)
            return true;

        if (!constraints.nplanets)
            return true;

        var nplanets = this.get('nplanets');

        var ready = true;
        ready &= (nplanets < constraints.nplanets);

        return ready;
    },
    
    ensureConstraintsForBody: function(i) {
        var constraints = app.mission().get('constraints');
        if (!constraints)
            return false;
        
        var changed = false;
        var pos = this.get('position');
        var x = [pos[(i+1)*NPHYS+X], pos[(i+1)*NPHYS+Y], pos[(i+1)*NPHYS+Z]];
        var vel = this.get('velocity');
        var v = [vel[(i+1)*NPHYS+X], vel[(i+1)*NPHYS+Y], vel[(i+1)*NPHYS+Z]];

        if (constraints.direction == 'perpendicular') {

            var vn = _m.norm(v);
            var xn = _m.norm(x);
            
            v[0] = -x[1]/xn * vn;
            v[1] = x[0]/xn * vn;
            v[2] = v[2];

            vel[(i+1) * NPHYS+X] = v[0];
            vel[(i+1) * NPHYS+Y] = v[1];
            vel[(i+1) * NPHYS+Z] = v[2];
            changed = true;
        };

        if (constraints.speed) {
            var speed = constraints.speed / (Units.RUNIT / Units.TUNIT / 1e5);            
            vn = _m.norm(v);
            vel[(i+1) * NPHYS+X] = v[0]/vn * speed;
            vel[(i+1) * NPHYS+Y] = v[1]/vn * speed;
            vel[(i+1) * NPHYS+Z] = v[2]/vn * speed;            
        }
        return changed;
    },

    /*
     * Sets the velocity for the i-th body.
     */
    setVelocityForBody: function(i, v) {
        var velocity = this.get('velocity');


        velocity[(i+1)*NPHYS+X] = v[0];
        velocity[(i+1)*NPHYS+Y] = v[1];
        velocity[(i+1)*NPHYS+Z] = v[2];

        this.ensureConstraintsForBody(i);
        Physics.barycenter(this.ctx);

        this.trigger("change:velocity");        
    },


    /*
     * Calculates the barycenter of the system.
     */
    barycenter:function() {
        return this.ctx.bary;
    },
    
    /*
     * Makes the system advance by deltat, updating the position and velocities
     * of all bodies.
     */
    tick: function() {
        if (this.get('invalid') || this.get('state') == MENU)
            return;
        
        var t = this.get('time');
        var deltat = this.get('deltat');
        var nplanets = this.get('nplanets');
        
        this.ctx.t = t;
        this.ctx.x = this.get('position');
        this.ctx.v = this.get('velocity');
        this.ctx.M = this.get('masses');

        var dt = deltat;
        for (var i = 1; i <= app.get('nplanets'); i++) {
            var r = Math.sqrt(this.ctx.x[i*NPHYS+X] * this.ctx.x[i*NPHYS+X] +
                              this.ctx.x[i*NPHYS+Y] * this.ctx.x[i*NPHYS+Y]);
            
            dt = Math.min(dt, 0.05*Math.sqrt(r*r*r/K2));
        }

        var collided = false;
        var minAU = this.get('minAU');
        var steps = (deltat / dt) | 0;
        var rem = deltat % dt;
        
        for (var j = 0; j <= steps; j++) {
            if (j == steps && rem < 1e-8)
                break;
            else if (j == steps)
                dt = rem;
            
            Physics.leapfrog(this.ctx.t+dt, this.ctx);

            for (i = 1; i <= app.get('nplanets'); i++) {
                var dx = this.ctx.x[i*NPHYS+X] - this.ctx.x[X];
                var dy = this.ctx.x[i*NPHYS+Y] - this.ctx.x[Y];
                var dz = this.ctx.x[i*NPHYS+Z] - this.ctx.x[Z];
                
                r = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (r < minAU)
                    collided = { x: this.ctx.x[i*NPHYS+X], y: this.ctx.x[i*NPHYS+Y], planet:i };
            }
            
            if (collided)
                break;
        }
        
        this.set('time', t+deltat);
        this.trigger("change:position");
        this.trigger("change:velocity");

        
        if (collided) {
            this.trigger('collision', collided);
            this.set('collided', true);
            this.set('invalid', true);
        }


        Physics.barycenter(this.ctx);

        this.trigger("tick");
    },

    /*
     * Returns a list of orbital elements for each planet.
     */
    elements: function(update) {
        if (this.ctx.elements && !update) {
            return this.ctx.elements;
        }
        
        var x = this.get('position');
        var v = this.get('velocity');
        var M = this.get('masses');
        var np = this.get('nplanets');
        
        this.ctx.Mstar = M[0];
        this.ctx.twoD = true;

        if (! this.ctx.elements || this.ctx.elements.length != np)
            this.ctx.elements = [];
        
        for (var i = 1; i <= np; i++) {
            var dx = x[i*NPHYS+X]-x[X];
            var dy = x[i*NPHYS+Y]-x[Y];
            var dz = x[i*NPHYS+Z]-x[Z];
            var du = v[i*NPHYS+X]-v[X];
            var dv = v[i*NPHYS+Y]-v[Y];
            var dw = v[i*NPHYS+Z]-v[Z];
            this.ctx.elements[i-1] = Physics.x2el(this.ctx, 0, M[i], dx, dy, dz, du, dv, dw, this.ctx.elements[i-1]);
        }

        this.trigger('change:elements');
        return this.ctx.elements;
    },

    /*
     * Win the current mission.
     */
    win: function() {
        this.set('userEndTime', new Date());
        var mission = this.get('missions').at(this.get('currentMission'));
        mission.set('completed', true);
        
        mission.set('elapsed', this.elapsedTime(true));
        
        mission.set('stars', Math.max(mission.get('stars'), this.stars()));
        mission.set('elements', this.elements());
        mission.set('lastPlayed', new Date());

        app.saveMissionData();
        
        this.trigger('win' + this.stars());
        this.trigger('win');
    },

    /*
     * Lose the current mission.
     */
    lose: function() {
        this.set('userEndTime', new Date());
        this.trigger('lose');
    },

    /*
     * Move to given mission
     */
    setMission: function(mission) {
        if (mission === undefined)
            mission = this.get('currentMission')+1;
        
        this.set({ currentMission: mission });
        this.reset();

        var missionObj = this.mission();
        this.sounds.playMusic(missionObj.get('music'));      
        
        var bodies = missionObj.get('bodies');
        if (bodies) {
            _.each(bodies, function(body) {
//                console.log(body);
            });
        }
    },

    /*
     * Change the current state to MENU. This should trigger an update in the view, where
     * the app-menu div is brought to the forefront and UI elements are hidden.
     */
    menu: function() {
        this.set('state', MENU);
    },

    /*
     * Calculates elapsed time as a human-readable string.
     */
    elapsedTime: function(secondsOnly) {        
        var endTime = this.get('userEndTime') || new Date();
        var seconds = Math.round((endTime.getTime() - this.get('userStartTime').getTime()) / 1000);

        if (secondsOnly)
            return seconds;
        
        var minutes = Math.floor(seconds/60);
        seconds = seconds % 60;
        return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
    },

    /*
     * Calculate stars for the current mission.
     */
    stars: function() {
        var mission = app.mission();
        var starsFormula = mission.get('starsrule');
        if (! _.isFunction(starsFormula)) {
            return mission.get('value');
        } else
            return starsFormula();
    },

    /*
     * The total number of stars earned.
     */
    starsEarnedTotal: function() {
        return app.get('missions').reduce(function(memo, mission) {
            return memo + mission.get('stars');
        }, 0);
    },
    
    /*
     * Reset the state.
     */
    reset: function() {
        var defaults = this.defaults();
        this.set({
            masses: defaults.masses,
            position: defaults.position,
            velocity: defaults.velocity,
            types: defaults.types,
            nplanets: defaults.nplanets,
            
            time: defaults.time,
            state: defaults.state,
            currentHelp: defaults.currentHelp,
            userStartTime: new Date(),
            userEndTime: null,
            invalid: defaults.invalid,
            collided: defaults.collided
        });
        this.ctx.elements = null;
        this.trigger('reset');
        this.trigger('start');

        if (app.component)
            app.component.stopListening();
        
        var mission = app.mission();
        if (mission.get('type') && app.components[mission.get('type')]) {
            app.component = new app.components[mission.get('type')]({ model: this });
        }
    },


    /*
     * Read in properties from app.yaml.
     */
    loadConfig: function(dict) {
        var missions = dict.missions;
        var coll = new MissionCollection();
        var starsBounty = 0;
        
        _.each(missions, function(mission) {
            var m = new Mission(mission);
            coll.add(m);
            starsBounty += m.get('value') || 3;                
        });

        delete dict.missions;
        this.set(dict);
        this.set('missions', coll);
        this.set('starsBounty', starsBounty);
    },

    /*
     * Read data from server.
     */
    loadMissionData: function() {
        app.trigger('loading');
        _.defer(function() {
            $.get('php/gamedata.php?action=load')
            .done(function(data) {
                if (data.trim() != "") {
                    data = JSON.parse(data);
                    var missions = app.get('missions');

                    for (var i = 0; i < data.length; i++) {
                        if (! data[i].name) {
                            console.error("Mission #" + i + " does not have a name property.");
                            continue;
                        }
                        var which = missions.where({ name : data[i].name });

                        if (!which || which.length == 0 || which.length > 1) {
                            console.error("Mission named " + data[i].name + " has either 0 or multiple corresponding missions in the configuration file.");
                            continue;
                        }
                        
                        which[0].set(data[i]);
                    }
                    
                }

                _.delay(function() {
                    app.trigger('load');
                    app.menu();
                }, 3000);
            });
        });
    },

    /*
     * Save data to server.
     */
    saveMissionData: function() {
        var data = JSON.stringify(app.get('missions'));
        var earned_stars = app.starsEarnedTotal();
        app.trigger('saving');
        $.post('php/gamedata.php?action=save', {
            data:data,
            earned_stars:earned_stars
        }).done(function(data) {
            app.trigger('saved', data);
        });
    },

    /*
     * Reset user's mission data.
     */
    resetMissionData: function() {
        var self = this;
        $.post('php/gamedata.php?action=reset').done(function() {
            location.reload();
        });
    },

    /*
     * Get a pointer to current mission, or a specific mission.
     */

    mission: function(which) {
        if (!which)
            return app.get('missions').at(app.get('currentMission'));
        else if (_.isNumber(which))
            return app.get('missions').at(which);
        else
            return app.get('missions').pluck({ name: which })[0];
    },

    
    /*
     * Initializes the model, by creating a "context" object. The context
     * object is used by the leapfrog function.
     */
    initialize: function() {
        this.ctx = {M:this.get('masses'), x: this.get('position'), v:this.get('velocity'), dt: 0.25 };
        this.listenTo(this, "planet:drag planet:dragvelocity", function() { this.elements(true); });
    }
});

// Creates the global singleton object that contains the application state.
var app = new App();

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
        "click #help": function() { this.renderMission(); app.trigger('hint'); },
        "click #reset": function() { app.reset(); },
        "click #missions": function() { app.menu(); },
        "click #dashboard": function() { location.href='../dashboard'; },
        "click #sizes": function() { app.set('physicalSizes', !app.get('physicalSizes')); },
        "click #zoom-in": function() { draw.setZoom(draw.zoom*2); },
        "click #zoom-out": function() { draw.setZoom(draw.zoom/2); },
        "click #zoom": function() { $("#toolbar-zoom").addClass("expanded").removeClass("hidden"); },
        "click #zoom-close": function() { $("#toolbar-zoom").removeClass("expanded").addClass("hidden"); }
        
    },

    // Binds functions to change events in the model.
    initialize: function() {
        var self = this;

        // Update information when planetary parameters change
        self.listenTo(self.model, 'change:nplanets change:time change:position change:velocity change:elements', _.throttle(self.renderInfo, 500));
        
        self.listenTo(self.model, 'start change:missions reset', self.renderMission);
        self.listenTo(self.model, 'change:state', self.setVisibility);
        self.listenTo(self.model, 'win', self.renderWin);
        self.listenTo(self.model, 'lose', self.renderLose);
        
        // Renders the information table on the top-right corner.
        this.renderInfo();

        // A timer that checks whether a mission has been completed, by running the
        // validate function.
        self.listenTo(self.model, 'start change:missions reset', function() {
            if (self.validateTimer)
                clearTimeout(self.validateTimer);            
        });

        self.listenTo(self.model, 'change:state', function() {
            if (app.get('state') != RUNNING)
                return;

            if (self.validateTimer)
                clearTimeout(self.validateTimer);
            
            self.validateTimer = _.delay(_.bind(self.validate, self), 5000);
        });
    },

    /*
     * Renders the mission list in the left sidebar. There are three states for the missions:
     * "MISSION" (a mission that has not been completed yet), "MISSION_ACTIVE" (the current mission),
     * and "MISSION_COMPLETED" (a completed mission).
     *
     * Each one corresponds to a different CSS class. The #missions div is filled with the titles
     * and icons of the missions.
     */
    
    missionTemplate: _.template('<div class="title"><span class="fa fa-rocket"></span> <%= title %></div><div class="subtitle"><%= subtitle %></div>'),
    missionDelay: 7000,
    topHideTimer: null,

    renderTopText: function(text, hide) {
        $("#text-top").html(text);
        $("#text-top").addClass("expanded");
        $("#text-top").removeClass("in-front");

        if (this.topHideTimer)
            clearTimeout(this.topHideTimer);

        if (hide)
            this.topHideTimer = _.delay(function() {
                $("#text-top").removeClass("expanded");
                $("#text-top").removeClass("in-front");        
            }, this.missionDelay);
    },
    
    renderMission: function() {
        // Check if the top banner is already expanded; if it is, hide it
        // temporarily and show it again.
        var current = this.model.get('currentMission');
        var mission = this.model.get('missions').at(current);
        
        this.renderTopText(this.missionTemplate(mission.attributes), true);        
    },


    els: {},

    
    /*
     * Fills the table on the top-right hand side with the relevant information. renderInfo is
     * throttled so it is only updated once per second (or so).
     *
     * For now, it displays time (in days), the distance from the central star (in 10^8 km),
     * and the speed (in km/s).
     */    
    renderInfo: function() {
        
        if (app.get('nplanets') > 0) {
            $("#time").text(this.model.get('time') + " days");

            var els = app.elements();
            var position = app.get('position');
            var velocity = app.get('velocity');
            var masses = app.get('masses');
            
            var r = Math.sqrt((position[X]-position[NPHYS+X])*(position[X]-position[NPHYS+X]) +
                              (position[Y]-position[NPHYS+Y])*(position[Y]-position[NPHYS+Y]) +
                              (position[Z]-position[NPHYS+Z])*(position[Z]-position[NPHYS+Z]));

            var v = Math.sqrt((velocity[X]-velocity[NPHYS+X])*(velocity[X]-velocity[NPHYS+X]) +
                              (velocity[Y]-velocity[NPHYS+Y])*(velocity[Y]-velocity[NPHYS+Y]) +
                              (velocity[Z]-velocity[NPHYS+Z])*(velocity[Z]-velocity[NPHYS+Z]));
            
            $("#distance").html((r * Units.RUNIT / (1e11)).toFixed(1) + " million km");
            $("#speed").text((v * Units.RUNIT / Units.TUNIT / (1e5)).toFixed(1) + " km/s");
           
            $("#eccentricity").text(els[0].eccentricity.toFixed(2));
            
        } else {
            $("#distance").text("");
            $("#speed").text("");
            $("#eccentricity").text("");
            $("#time").text("");
        }
    },

    /*
     * When the user is shown the mission menu, fade away all the UI elements that could be distracting.
     */
    setVisibility: function() {
        var state = app.get('state');

        if (state == MENU) {
            $("#sidebar").hide();
            $("#help-text").removeClass("expanded");
            $("#info-top").hide();
            $("#help").hide();
            $("#text-top").removeClass("expanded");
        } else {
            $("#sidebar").show();
            $("#info-top").show();
            $("#help").show();
        }        
    },

    /*
     * Event forwarded from draw.js when the user clicks or taps on the canvas. If the current state is RUNNING,
     * then tapping anywhere will pause the app. Otherwise, add a new planet.
     */
    canvasMouseDown: function(e) {
        if (app.get('state') == PAUSED) {
            app.addPlanet(e.position);
        }
    },

    /*
     * Checks whether the mission's objective has been accomplished. The mission's objective is written in the "rule" parameter.
     *
     */
    validate: function() {
        var f = app.mission().get('rule')();
        if (f) {
            this.model.win();
            clearInterval(this.validateTimer);
        } else {
            this.model.lose();
        }
    },

    /*
     * Render win.
     */

    winTemplate: _.template('<div class="font-l"><%= win %></div><div class="font-l"><%= stars %></div><br><button class="btn-jrs font-m" onClick="app.menu()"><span class="fa fa-graduation-cap"></span> Go to the next mission!</button>'),
    winDelayMax: 10000,
    approxFrameRate: 1/60.,
    
    renderWin: function() {
        var mission = app.mission();
        var els = app.get('elements');
        var winDelay = 0;
        if (els.length > 0 && !isNaN(els[0].period))
            winDelay = Math.min(this.winDelayMax, els[0].period / app.get('deltat') * this.approxFrameRate * 1000);
        
        winDelay = Math.max(4000, winDelay);

        this.renderTopText(this.winTemplate({
            win: mission.get('win'),
            stars: mission.starsRepr()
        }), false);
        $("#text-top").addClass("in-front");

        app.set('state', ROTATABLE);
        
    },

    loseTemplate: _.template('<div class="subtitle"><%= lose %></div><div><button class="btn-jrs font-m" onClick="app.reset(); app.menuView.renderMission(); "><span class="icon-thumbs-up"></span> No worries! Retry mission</button></div>'),
    
    renderLose: function() {
        var mission = app.get('missions').at(app.get('currentMission'));
        
        $("#text-top").html(this.loseTemplate(mission.attributes));
        $("#text-top").addClass("expanded");
        $("#text-top").addClass("in-front");
        app.set('state', ROTATABLE);
    },
    
    auxToolbar: function(template) {
        
    }
    

});

var MissionHelpModel = Backbone.Model.extend({
    defaults: {
        model:app,
        currentHelp: 0
    },
                    
    proceed: function() {
        this.set('currentHelp', this.get('currentHelp') + 1);
        this.trigger('proceed');
        app.trigger('proceed');
    },

    destroy: function() {
        this.stopListening();
    },
    
    setup: function() {
        
        var model = this.get('model');
        
        var mission = model.mission();
        if (!mission.get('help')) {
            this.trigger('help', null);
            return;
        }

        this.listenTo(model, 'win', function() {
            this.destroy();
        });
        
        var h = mission.get('help');
        var self = this;
        var shown = [];
        
        for (var i = 0; i < h.length; i++) {
            var on = h[i].on;
            if (! on) {
                continue;
            }

            if (on == 'proceed') {
                this.listenTo(this, on, (function(j) {
                    return function() {
                        if (self.get('currentHelp') == j) {
                            self.trigger('help', h[j]);
                        }
                    };
                })(i));
            } else {
                this.listenTo(model, on, (function(j, jon) {
                    return function() {
                        if (! shown[j]) {
                            self.trigger('help', h[j]);
                            self.set('currentHelp', j);
                            if (jon != 'hint')
                                shown[j] = true;
                        }
                    };
                })(i, on));
            }

            if (on == "start")
                this.trigger('help', mission.get('help')[0]);
        }
        
        
    },
    
    initialize: function() {
    }
});

var MessageView = Backbone.View.extend({
    el: $("#help-body"),
    

    messagesSetup:false,
    
    
    initialize: function() {
        
        this.listenToOnce(this.model, "change:missions", function() {
            this.setupTemplates();
        });
        
        this.listenTo(this.model, "start", function() {
            console.log('start, Setting up');
            this.render(null);
            this.setupMessages();
        });
        
        this.listenTo(this.model, "win lose", function() { self.render(null); });
        var self = this;
        $("#help-next").on("click", function() { self.model.proceed(); });
    },


    
    setupTemplates: function() {
        if (this.messagesSetup)
            return;
        var self = this;
        var missions = this.model.get('missions');

        for (var i = 0; i < missions.length; i++) {
            var m = missions.at(i);
            var help = m.get('help');
            if (!help)
                continue;
            
            for (var j = 0; j < help.length; j++) {
                app.templates.template(help[j]);
            };
            m.set('help', help);
            
        }
        this.messagesSetup = true;
    },

    setupMessages: function() {
        if (this.listener) {
            this.stopListening(this.listener);
            this.listener.destroy();
            this.listener = null;
        }
        console.log(app.get('currentMission'));
        this.listener = new MissionHelpModel({ model:this.model });
        this.listenTo(this.listener, 'help', this.render);
        this.listenTo(this.model, 'help', this.render);
        this.listener.setup();
    },

    plainText: function(txt) {
        return txt.replace(/<script.+?<\/script>/, '').replace(/<button.+?<\/button>/, '').replace(/<.+?>/g, '').replace(/&.+;/g, '');
    },

    render: function(help) {
        var helpText = (help ? help.message : null);
        
        var self = this;
        if (helpText && self.lastHelp == helpText) {
            $("#help-text").addClass("expanded");        
            return;
        }
        self.lastHelp = helpText;

        _.defer(function() {
            app.set('interactive', true);
        });
        
        $("#help-text").removeClass("expanded");
        
        if (!helpText) {
            $("#help-body").html("");
            return;
        }
        
        _.delay(function() {
            self.$el.html(helpText);
            var plainText = self.plainText(helpText);
            $("#help-next").on("click", function() { self.listener.proceed(); } );
            $("#help-close").on("click", function() { self.hide(); });
            $("#help-next-mission").on("click", function() { self.model.nextMission(); } );
            
            $("#help-text").addClass("expanded");
            app.mainView.renderInfo();
            if (help)
                for (var i = 0; i < help.funcs.length; i++)
                    help.funcs[i]();
        }, 500);
    },

    hide: function() {
        this.render(null);
    }
});

/*
var AppMenuView = Backbone.View.extend({
    // Top-level container
    el: $("#app-menu"),
    
    star: '<span class="icon-win-star"></span>',
    star_o: '<span class="icon-win-star-o"></span>',

    initialize: function() {
        this.listenTo(this.model, "change:state", this.render);
    },

    render: function() {
        var state = this.model.get('state');
        var $el = this.$el;
        
        if (state === MENU) {
            $el.addClass("expanded");
            this.renderMissionMenu();
        } else {
            $el.removeClass("expanded");
        }
    },

    missionContainer: '<div class="mission"></div>',
    clear: '<div class="clear"></div>',
    missionThumb: '<div class="mission-thumb"></div>',

    missionThumbIcon: _.template('<div class="<%= containerClass %>"></div>'),

    defaultIconNext: 'icon-mission-next',
    defaultIconLocked: 'icon-mission-locked',
    defaultIconCompleted: 'icon-mission-completed',
    
    missionTitleTemplate: _.template('<div class="mission-stars"><%= stars %></div><div class="mission-title"><%= title %></div><div class="mission-subtitle"><%= subtitle %></div>'),
    missionTotalsTemplate: _.template('<%= starsEarned %> / <%= starsBounty %> stars earned.'),
    $missions: $("#app-menu-missions"),
    
    renderMissionMenu: function() {
        this.$missions.empty();
        var missions = app.get('missions');
        var currentMission = app.get('currentMission');
        
        for (var i = 0; i < missions.length; i++) {
            var mission = missions.at(i);
            var icon = mission.get('icon');
            
            var $div = $(this.missionContainer);

            var $thumb = $(this.missionThumb);

            if (mission.get('completed')) {
                $thumb.addClass("mission-thumb-completed");
                if (icon)
                    $thumb.addClass(icon+"-b");
                
                $thumb.on("click", _.partial(function(i) {
                    app.sounds.playEffect('clickety');
                    app.setMission(i);
                }, i));
            } else if ((i > 0 && missions.at(i-1).get('completed')) || (i == 0 && !missions.at(0).get('completed'))) {
                $thumb.addClass("mission-thumb-next");

                $thumb.addClass(icon ? icon + "-b" : this.defaultIconNext);
                $thumb.append(this.missionThumbNext);
                $thumb.on("click", _.partial(function(i) {
                    app.sounds.playEffect('clickety');
                    app.setMission(i);
                }, i));
            } else {
                $thumb.addClass(this.defaultIconLocked);
            }
                        
            $div.append($thumb);
            $div.append(this.missionTitleTemplate({
                stars: mission.get('starsRepr'),
                title: mission.get('title'),
                subtitle: mission.get('subtitle')
            }));
            
            this.$missions.append($div);
        }

        this.$missions.append(this.clear);

        var stars = missions.at(currentMission).get('stars');
        var text = "";
        for (i = 0; i < stars; i++)
            text += app.templates.FULL_STAR;
        for (i = stars; i < 3; i++)
            text += app.templates.EMPTY_STAR;
        
        $("#app-menu-stars").html(text);

        var starsEarned = app.get('starsEarnedTotal');
        var starsBounty = app.get('starsBounty');
        $("#app-menu-totals").html(this.missionTotalsTemplate({ starsEarned: starsEarned, starsBounty: starsBounty  }));        
    },

    renderOrbit: function(ctx) {
    }
});
    */

var AppModalView = Backbone.View.extend({
    // Top-level container
    el: $("#app-modal"),
    
    initialize: function() {
        this.listenTo(this.model, "loading", this.renderLoading);
        this.listenTo(this.model, "load", this.renderLoad);
    },

    loadingMessage: 'Loading data...<br><i class="fa fa-circle-o-notch fa-spin"></i>',
    
    renderLoading:function() {
        $("#app-modal").html(this.loadingMessage);
        $("#app").hide();
        this.$el.show();
    },

    renderLoad: function() {
        $("#app").show();
        this.$el.hide();
    }
});

$(document).ready(function() {
    app.mainView = new AppView({ model: app });
    app.templates = new Templates();
    app.messageView = new MessageView({ model: app });
    app.menuView = new AppMenuView({model: app});
    app.modalView = new AppModalView({model:app});
    
    // APP_CFG is an object created statically by the backend and inserted in
    // a top-level <script> tag. This is done so that the model does not have to
    // fetch it asynchronously from a .json file.
    // APP_CFG replicates the configuration options contained in app.yaml: e.g.,
    // mission text and objectives.
    app.loadConfig(APP_CFG);
    app.loadMissionData();
    app.sounds = new SoundEngine(app);

    APP_CFG = null;

    app.once('load', function() {
        if (_.parameter('mission') != null) {
            app.setMission(_.parameter('mission')|0);
            console.error("Check if mission is kosher.");
        }
    });
});


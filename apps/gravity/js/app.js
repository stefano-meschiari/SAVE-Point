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
    defaults: function() {
        return {
            // start with the first mission
            currentMission: 0,
            // last mission beaten
            missionBeaten: -1,
            // start off in a PAUSED state (can either be PAUSED, RUNNING or MENU); when PAUSED,
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
        };
    },

    /*
     * Enable computed, read-only properties
     */
    get: function(attr) {
        if (this.attributes[attr] !== undefined)
            return this.attributes[attr];
        else if (this[attr])
            return this[attr]();
        else
            return undefined;
    },
    
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
            console.warn("app.toggleState() used when state is ", state);
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
        this._elements = null;
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
    
    elements: function(update) {
        if (this._elements && !update) {
            return this._elements;
        }
        
        var x = this.get('position');
        var v = this.get('velocity');
        var M = this.get('masses');
        var np = this.get('nplanets');
        
        this.Mstar = M[0];
        this.twoD = true;

        if (! this._elements || this._elements.length != np)
            this._elements = [];
        
        for (var i = 1; i <= np; i++) {
            var dx = x[i*NPHYS+X]-x[X];
            var dy = x[i*NPHYS+Y]-x[Y];
            var dz = x[i*NPHYS+Z]-x[Z];
            var du = v[i*NPHYS+X]-v[X];
            var dv = v[i*NPHYS+Y]-v[Y];
            var dw = v[i*NPHYS+Z]-v[Z];
            this._elements[i-1] = Physics.x2el(this, 0, M[i], dx, dy, dz, du, dv, dw, this._elements[i-1]);
        }

        this.trigger('change:elements');
        return this._elements;
    },

    /*
     * Win the current mission.
     */
    win: function() {
        this.trigger('win');
    },

    /*
     * Move to next mission
     */
    nextMission: function() {
        this.reset();
        this.set({ currentMission: this.get('currentMission') + 1});
    },

    /*
     * Change the current state to MENU. This should trigger an update in the view, where
     * the app-menu div is brought to the forefront and UI elements are hidden.
     */
    menu: function() {
        this.set('state', MENU);
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
            nplanets: defaults.nplanets,
            time: defaults.time,
            state: defaults.state,
            currentHelp: defaults.currentHelp
        });
        this._elements = null;
        this.trigger('reset');
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
        "click #help": function() { alert("Not implemented yet."); }
    },

    // Binds functions to change events in the model.
    initialize: function() {
        var self = this;

        // Update information when planetary parameters change
        self.listenTo(self.model, 'change:nplanets change:time change:position change:velocity change:elements', _.throttle(self.renderInfo, 500));
        
        self.listenTo(self.model, 'change:currentMission change:missions', self.renderMissions);
        self.listenTo(self.model, 'change:state', self.setVisibility);
        
        // Renders the information table on the top-right corner.
        self.renderInfo();

        // A timer that checks whether a mission has been completed, by running the
        // validate function.
        self.listenTo(self.model, 'change:currentMission change:missions', function() {
            if (self.validateTimer)
                clearInterval(self.validateTimer);
            
            self.validateTimer = setInterval(_.bind(self.validate, self), 1000);
        });
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
        /*        var current = this.model.get('currentMission');
        var missions = this.model.get('missions');
        var $div = $('<div id="missions"></div>');
        
        for (var i = 0; i < missions.length; i++) {
            var type = (current == i ? this.MISSION_ACTIVE : (i < current ? this.MISSION_COMPLETED : this.MISSION));
            $div.append(this.MISSION_TEMPLATE({ type: type, label: missions[i].title }));
        }

         $("#missions").replaceWith($div);*/

        var current = this.model.get('currentMission');
        var missions = this.model.get('missions');
        
        $("#text-top").html('<div class="title"><span class="fa fa-rocket"></span> ' + missions[current].title + '</div><div class="subtitle">' + missions[current].subtitle + "</div>");
        $("#text-top").addClass("expanded");

        _.delay(function() {
            $("#text-top").removeClass("expanded");
        }, 5000);
    },

    /*
     * Fills the table on the top-right hand side with the relevant information. renderInfo is
     * throttled so it is only updated once per second (or so).
     *
     * For now, it displays time (in days), the distance from the central star (in 10^8 km),
     * and the speed (in km/s).
     */

    els: {},
    system: { twoD:true, Mstar: 1},
    
    renderInfo: function() {
        $("#time").text(this.model.get('time') + " days");
        if (app.get('nplanets') > 0) {
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
            
            $("#distance").html((r * Units.RUNIT / (1e11)).toFixed(2) + " x 10<sup>6</sup> km");
            $("#speed").text((v * Units.RUNIT / Units.TUNIT / (1e5)).toFixed(2) + " km/s");
           
            $("#eccentricity").text(els[0].eccentricity.toFixed(2));
            
        } else {
            $("#distance").text("");
            $("#speed").text("");
            $("#eccentricity").text("");
        }
    },

    /*
     * When the user is shown the mission menu, fade away all the UI elements that could be distracting.
     */
    setVisibility: function() {
        console.log(state);
        var state = app.get('state');

        if (state == MENU) {
            $("#sidebar").hide();
            $("#help-text").hide();
            $("#info-top").hide();
        } else {
            $("#sidebar").show();
            $("#help-text").show();
            $("#info-top").show();
        }
        
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

        var f = RULES_FN[app.get('currentMission')]();
        if (f) {
            this.model.win();
            clearInterval(this.validateTimer);
        }
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
    },

    destroy: function() {
        console.log("Destroyed");
        this.stopListening();
    },
    
    setup: function() {
        
        var model = this.get('model');
        var currentMission = model.get('currentMission');
        
        var mission = model.get('missions')[currentMission];
        if (!mission.help) {
            this.trigger('help', null);
            return;
        }

        this.listenTo(model, 'win', function() {
            this.destroy();
        });
        
        var h = mission.help;
        var self = this;
        
        for (var i = 0; i < h.length; i++) {
            var on = h[i].on;
            if (! on) {
                console.log('Help message #' + i + " does not have an 'on' event.");
                continue;
            }

            if (on == 'proceed') {
                this.listenTo(this, on, (function(j) {
                    return function() {
                        console.log(j, currentMission, self.get('currentHelp'));
                        if (self.get('currentHelp') == j)
                            self.trigger('help', h[j].message);
                    };
                })(i));
            } else {
                this.listenTo(model, on, (function(j) {
                    return function() {
                        console.log(j, currentMission, self.get('currentHelp'));                        
                        self.trigger('help', h[j].message);
                    };
                })(i));
            }
        }

        console.log(currentMission, mission.help[0].message);
        this.trigger('help', mission.help[0].message);
    },
    
    initialize: function() {
    }
});

var MissionHelpView = Backbone.View.extend({
    el: $("#help-body"),
    safeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'b', 'i', 'u'],

    NEXT_LABEL: '<span class="fa fa-chevron-circle-right"></span> Next',
    NEXT_MISSION_LABEL: '<span class="fa fa-thumbs-up"></span> Next Mission',
    
    templater: {
        "@separator": '<div class="separator"></div>',
        "@icon-tap": '<span class="icon-tap"></span>',
        "@icon-drag": '<span class="icon-drag"></span>',
        "@icon-star": '<span class="icon-star"></span>',
        "@icon-rocket": '<span class="fa fa-rocket"></span>',
        "@icon-win": '<span class="icon-win"></span>',
        "@icon-menu": '<span class="icon-menu"></span>',
        "\\*(.+?)\\*": "<strong>$1</strong>",
        "^(#)\\s*(.+)": "<h1>$2</h1>",
        "^\s*$": "<br>",
        "@proceed-win": '<div class="help-toolbar"><button id="help-next-mission" class="btn btn-lg btn-jrs"><span class="fa fa-thumbs-up"></span>  Next mission</button></div>',
        "@proceed": '<div class="help-toolbar"><button id="help-next" class="btn btn-lg btn-jrs"><span class="fa fa-chevron-right"></span>  Next</button></div>',
        "@eccentricity": '<span id="eccentricity"></span>',
        
        "@wait-1": '<script> _.delay(function() { app.trigger("proceed()");  }, 1000); </script>',
        "@wait-5": '<script> _.delay(function() { app.trigger("proceed()");  }, 5000); </script>',
        "@wait-30": '<script> _.delay(function() { app.trigger("proceed()");  }, 30000); </script>'
    },
    
    
    initialize: function() {
        var safeTags = this.safeTags;

        for (var i = 0; i < safeTags.length; i++) {
            this.templater['@' + safeTags[i]] = "<" + safeTags[i] + ">";
            this.templater['@/' + safeTags[i]] = "</" + safeTags[i] + ">";
        }
        
        this.listenToOnce(this.model, "change:missions", function() {
            this.setupTemplates();
            this.setupMessages();
        });
        this.listenTo(this.model, "change:currentMission", this.setupMessages);
        this.listenTo(this.model, "win", function() { self.render(null); });
        
        var self = this;
        $("#help-next").on("click", function() { self.model.proceed(); });
    },

    setupTemplates: function() {
        var missions = this.model.get('missions');
        var templater = this.templater;

        for (var i = 0; i < missions.length; i++) {
            var m = missions[i];
            if (!m.help)
                continue;

            for (var j = 0; j < m.help.length; j++) {
                m.help[j].message = _.escapeHTML(m.help[j].message);
                
                m.help[j].message = _.reduce( _.keys(templater), function(transformed, tag) {
                    return transformed.replace(new RegExp(tag, 'gm'), templater[tag]);
                }, m.help[j].message);
            };
        }
    },

    setupMessages: function() {
        if (this.listener) {
            this.stopListening(this.listener);
            this.listener.destroy();
        }
        console.log(this.model.get('currentMission'));
        
        this.listener = new MissionHelpModel({ model:this.model });
        this.listenTo(this.listener, 'help', this.render);
        this.listener.setup();
    },

    render: function(helpText) {
        var self = this;
        console.log(helpText);
        
        $("#help-text").removeClass("expanded");
        
        if (!helpText) {
            return;
        }
        
        _.delay(function() {
            console.log(helpText);
            self.$el.html(helpText);
            $("#help-next").on("click", function() { self.listener.proceed(); } );
            $("#help-next-mission").on("click", function() { self.model.nextMission(); } );
            
            $("#help-text").addClass("expanded");
            app.mainView.renderInfo();
        }, 500);
    }
});

var AppMenuView = Backbone.View.extend({
    // Top-level container
    el: $("#app-menu-container"),

    // Events table mapping button to UI updates.
    events: {
        "click #menu": function() { $("#sidebar").toggleClass("expanded"); },
        "click #help": function() { alert("Not implemented yet."); }
    },

    initialize: function() {
        
    }
});

$(document).ready(function() {
    app.mainView = new AppView({ model: app });
    app.helpView = new MissionHelpView({ model: app });
    app.menuView = new AppMenuView({model: app});
    
    // APP_CFG is an object created statically by the backend and inserted in
    // a top-level <script> tag. This is done so that the model does not have to
    // fetch it asynchronously from a .json file.
    // APP_CFG replicates the configuration options contained in app.yaml: e.g.,
    // mission text and objectives.
    app.set(APP_CFG);
    APP_CFG = null;
});


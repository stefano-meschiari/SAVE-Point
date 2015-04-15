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

window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


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
    defaults: function() {
        return {
            completed: false,
            elapsed: -1,
            elementsf: null,
            stars: 0,
            lastPlayed: null,
            name: '',
            trialDurations: [],
            trialStars: [],
            trialActions: [],
            trialDates: [],
            trialData: []
        };
    },

    toJSON: function() {
        return _.pick(this.attributes, _.keys(this.defaults()));
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

var TYPE_STAR = 1;
var TYPE_PLANET = 2;
var TYPE_STAR_FIXED = 4;
var TYPE_PLANET_FIXED = 8;
var TYPE_HALO = 16;
var TYPE_OUTLINE = 32;
var TYPE_DRAG = 64;

var POV_BARYCENTRIC = 0;

var POWERS = [
    "can-zoom",
    "can-toggle-sizes",
    "can-select-mass"
];

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
            centeredPosition: [0, 0, 0],
            // initial velocity of the star (AU/day). The vector contains the 3
            // velocity components for each body, (v_x^0, v_y^0, v_z^0, v_x^1, v_y^1, v_z^1, ...),
            // so that the are 3*nplanets components.
            velocity: [0, 0, 0],
            // initial mass of the star (MSUN). The vector contains the masses of
            // all the bodies in the system.
            masses: [1],
            // default mass of new objects
            defaultMass: Units.MEARTH / Units.MSUN,
            // mission collection
            missions: null,
            // interactive?
            interactive: true,
            alive: true,
            // invalid?
            invalid:false,
            // has a collision happened?
            collided:false,
            // physical vs cartoon sizes
            physicalSizes:false,
            // selected planet
            selectedPlanet: 0,
            // number of stars gained so far
            starsEarned:[],            
            maxAU: 1.5,
            minAU: 0.19,
            // Music settings
            musicVolume:0.1,
            effectsVolume:0.2,
            // Cutscenes
            cutscenesPlayed:[], 
            // Powers
            activePowers: [],
            // Player name
            playerName: LOGGED_USER
        };
    },

    saveKeys: ['musicVolume', 'effectsVolume', 'activePowers', 'cutscenesPlayed', 'playerName'],
    components: {},
    flags: {},
    loaded: false,

    resetFlags: function() {
        this.flags = {};
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
    addPlanet: function(x, options) {
        // Return if there are already more planets than allowed.
        if (! this.ensureConstraints())
            return -1;

        // Append position and default velocity & mass to the
        // respective arrays, then fire the change events.
        var position = this.get('position');
        var velocity = this.get('velocity');
        var masses = this.get('masses');
        var types = this.get('bodyTypes');
        
        position.push(x[0], x[1], 0);
        if (options && options.type)
            types.push(options.type);
        else
            types.push(TYPE_PLANET);
        
        var v = Math.sqrt(K2);
        var r = Math.sqrt(x[0] * x[0] + x[1] * x[1]);
        
        if (! (options && options.circular)) {
            velocity.push(v * (-x[1]/r), v * (x[0]/r), 0);
        } else {
            v = Math.sqrt(K2/r);
            velocity.push(v * (-x[1]/r), v * (x[0]/r), 0);
        }
        masses.push(this.get('defaultMass'));
        this.ctx.elements = null;
        this.set('nplanets', this.get('nplanets')+1);
        this.ensureConstraintsForBody(this.get('nplanets')-1);        
        this.ctx.elements = null;
        this.trigger("addPlanet change:position change:velocity change:masses");
        this.set('selectedPlanet', this.get('nplanets'));
        Physics.barycenter(this.ctx);
        return masses.length;
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
        this.elements(true);
        this.trigger("change:position");
        Physics.barycenter(this.ctx);
    },

    /*
     * Returns the position for the i-th body, in internal units (AU)
     */
    positionForBody: function(i, x) {
        x = x || [];
        var position = this.get('position');
        x[0] = position[(i+1)*NPHYS+X];
        x[1] = position[(i+1)*NPHYS+Y];
        x[2] = position[(i+1)*NPHYS+Z];
        return x;
    },

    povPositionForBody: function(i, x) {
        x = this.positionForBody(i, x);
        var bary = this.barycenter();
        x[0] -= bary[0];
        x[1] -= bary[1];
        x[2] -= bary[2];
        return x;
    },

    povSetPositionForBody: function(i, x) {
        var bary = this.barycenter();
        x[0] += bary[0];
        x[1] += bary[1];
        x[2] += bary[2];
        this.setPositionForBody(i, x);
    },
    
    /*
     * Returns the mass for the body (internal units)
     */
    massForBody: function(i) {
        return this.get('masses')[i+1];
    },

    setMassForBody: function(i, mass) {
        this.get('masses')[i+1] = mass;
        this.trigger('change:masses');
    },

    typeForBody: function(i) {
        return this.get('bodyTypes')[i+1];
    },

    interactingSystem: function() {
        var masses = this.get('masses');
        for (var i = 1; i < masses.length; i++)
            if (masses[i] > 1.5 * Units.MEARTH/Units.MSUN)
                return true;
        return false;
    },

    
    /*
     * Returns the force for the i-th body, in internal units (AU/Msun/days)
     */
    forceForBody: function(body, power) {
        power = power || 3;
        var f = [0, 0, 0];
        var position = this.get('position');
        var masses = this.get('masses');
        var N = app.get('nplanets')+1;
        body += 1;

        var bodyX = position[body*NPHYS+X];
        var bodyY = position[body*NPHYS+Y];
        var bodyZ = position[body*NPHYS+Z];
        
        for (var i = 0; i < N; i++) {
            if (i == body)
                continue;

            var x = position[i * NPHYS+X];
            var y = position[i * NPHYS+Y];
            var z = position[i * NPHYS+Z];
            var M = masses[i];
            
            var d = Math.sqrt((x-bodyX)*(x-bodyX) + (y-bodyY)*(y-bodyY) + (z-bodyZ)*(z-bodyZ));
            var d3 = Math.pow(d, power);
            
            f[X] += -K2 * M * (bodyX - x) / d3;
            f[Y] += -K2 * M * (bodyY - y) / d3;
            f[Z] += -K2 * M * (bodyZ - z) / d3;

        }

        return f;
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
        this.trigger("change:velocity");        
    },

    originalURL: null,

    urlShare: function() {
        this.originalURL = [location.protocol, '//', location.host, location.pathname].join('');
        if (_.parameter('mission') && _.parameter('mission') == 'gravitykit')
            this.originalURL = [location.protocol, '//', location.host, '/gravitykit/'].join('');
        
        var fmt = function(x) {
            if (x == (x|0))
                return x;
            else if (Math.abs(x) < 1)
                return x.toExponential(3);
            else 
                return x.toFixed(2); 
        };

        app.once('cancelFly', function() {
            if (!_.parameter('u'))
                return;
            var id = +_.parameter('u');
            if (!_.isNumber(id))
                return;
            app.set('interactive', false);

            $.ajax({
                type:'GET',
                url:'/share/php/serv.php?action=get&id=' + id
            }).done(function(data) {
                data = JSON.parse(data);
                var x = _.map(data.x, function(x) { return +x; });
                var v = _.map(data.v, function(x) { return +x; });
                var m = _.map(data.m, function(x) { return +x; });
           
                app.set('position', x);
                app.set('velocity', v);
                app.set('masses', m);
                app.set('nplanets', m.length-1);
                app.ctx = {M:app.get('masses'), x: app.get('position'), v:app.get('velocity'), dt: 0.25};
                app.trigger("addPlanet change:position change:velocity change:masses");
                app.set('selectedPlanet', app.get('nplanets'));
                app.set('interactive', true);
            });
            
        });
        
        app.on("change:nplanets change:position change:masses change:velocity", function() {
            if (app.get('state') != PAUSED)
                return;

            app.params = app.params || { };
            
            app.params.x = [].concat(app.get('position'));
            app.params.v = [].concat(app.get('velocity'));
            app.params.m = [].concat(app.get('masses'));            
        });

        
    },

    random: function() {
        /*
        app.reset();

        app.once('cancelFly', function() {
            var np = _m.integerRandom(null, 1, 6)[0];
            var minAU = app.get('minAU');
            var maxAU = 0.75 * Math.min(window.innerWidth, window.innerHeight) / PIXELS_PER_AU;
            
            var mass = [];
            
            for (var i = 0; i < np; i++) {
                while (true) {
                    var a = Math.random() * (maxAU-minAU) + minAU;
                    var t = 2*Math.PI*Math.random();
                    
                    
                    x.push(a * Math.cos(t), a * Math.sin(t), 0);
                    
                }
                
            }
            
        });*/
    },

    resetToInitial: function() {
        if (app.params && app.params.x) {
            app.set('position', app.params.x);
            app.set('velocity', app.params.v);
            app.set('masses', app.params.m);
            app.set('nplanets', app.params.m.length-1);
            app.ctx = {M:app.get('masses'), x: app.get('position'), v:app.get('velocity'), dt: 0.25};
            app.set('invalid', false);
            app.set('collided', false);
            draw.destroyHandles();
            draw.destroyPlanets();
            draw.planetsUpdate();
            draw.resetView();
            app.set('state', PAUSED);
            app.trigger('resetmessages');
            app.trigger('change:nplanets');
        }
    },

    share: function() {
        $("#share-url").val("Loading...");
        UIkit.modal("#share-modal").show();
        console.log(JSON.stringify(app.params));

        $.ajax({
            type:'POST',
            url:"/share/php/serv.php?action=store",
            data: {val: JSON.stringify(app.params)}
        }).done(function(data) {
            $("#share-url").val(app.originalURL + "?u=" + data);
            $("#share-url").focus();
        });
    },
    
    /*
     * Calculates the barycenter of the system.
     */
    barycenter:function() {
        Physics.barycenter(this.ctx);                
        return this.ctx.bary;
    },
    
    /*
     * Makes the system advance by deltat, updating the position and velocities
     * of all bodies.
     */
    tick: function() {
        if (this.get('invalid') || this.get('state') == MENU || this.get('state') == PAUSED || !this.get('alive'))
            return false;

        // Subtract COM speed
        if (!this.get('centered')) {
            
        }
        
        var t = this.get('time');
        var deltat = this.get('deltat') * SPEED;
        var nplanets = this.get('nplanets');
        
        this.ctx.t = t;
        var dt = this.get('dt');

        for (var i = 1; i <= app.get('nplanets'); i++) {
            var r = Math.sqrt(this.ctx.x[i*NPHYS+X] * this.ctx.x[i*NPHYS+X] +
                              this.ctx.x[i*NPHYS+Y] * this.ctx.x[i*NPHYS+Y]);
            
            dt = Math.min(dt, 0.05*Math.sqrt(r*r*r/K2));
        }
        

        var collided = false;
        var minAU = this.get('minAU');
        var steps = (deltat / dt) | 0;
        var rem = deltat % dt;
        this.ctx.dt = dt;
        
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
                    collided = {pos: this.povPositionForBody(i-1), planet:i};
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


        Physics.barycenter(this.ctx, true);
        
        this.trigger("tick");
        return true;
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

        this.trigger('win' + this.stars());
        this.trigger('win');
        app.saveMissionData();
    },

    /*
     * Lose the current mission.
     */
    lose: function() {
        this.set('userEndTime', new Date());
        this.trigger('lose');
        app.saveMissionData();
    },

    /*
     * Move to given mission
     */
    setMission: function(mission) {
        if (mission === undefined)
            mission = this.get('currentMission')+1;

        var self = this;
        var missionName = mission;
        if (_.isString(mission)) {            
            app.get('missions').find(function(m, idx) {
                if (m.get('name') === mission) {
                    mission = idx;
                    return true;
                };
                return false;
            });
        }

        var previousMissionName = (app.mission() ? app.mission().get('name') : null);
        if (previousMissionName)
            $('html').removeClass(previousMissionName);
            
        this.set({ currentMission: mission });
        this.reset();

        $('html').addClass(this.mission().get('name'));
        
        var missionObj = this.mission();
        this.sounds.playMusic(missionObj.get('music'));      
        
        var bodies = missionObj.get('bodies');
        if (bodies) {
            _.each(bodies, function(body) {
                var type = TYPE_PLANET;
                if (body.type)
                    type = eval(body.type);
                
                var i = self.addPlanet(body.x, { type: type, circular: body.circular });
                if (body.v)
                    self.setVelocityForBody(i - 1, body.v);
                
            });
        }
    },

    /*
     * Change the current state to MENU. This should trigger an update in the view, where
     * the app-menu div is brought to the forefront and UI elements are hidden.
     */
    menu: function() {
        app.saveMissionData();
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
            return mission.get('value') || 3;
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
            centered:false,
            
            time: defaults.time,
            state: defaults.state,
            currentHelp: defaults.currentHelp,
            userStartTime: new Date(),
            userEndTime: null,
            invalid: defaults.invalid,
            collided: defaults.collided,
            selectedPlanet: defaults.selectedPlanet
        });
        this.ctx = {M:this.get('masses'), x: this.get('position'), v:this.get('velocity'), dt: 0.25};
        console.log('inited');
        this.trigger('reset');
        this.trigger('start');
        this.resetFlags();
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
        var missions = dict.missions.concat(dict.cutscenes);
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
        this.trigger('loading');

        if (EPHEMERAL_USER) {
            _.defer(function() {
                app.trigger('load');
                app.menu();
            });
            return;
        }
        var self = this;
        _.defer(function() {
            $.get('php/gamedata.php?action=load')
            .done(function(allData) {
                if (allData.trim() != "") {
                    var data = JSON.parse(allData);
                    console.log(data);
                    
                    var missionsData = data.missions || [];
                    var saveData = data.saveData || {};
                    
                    var missions = self.get('missions');

                    for (var i = 0; i < missionsData.length; i++) {
                        if (! missionsData[i].name) {
                            console.error("Mission #" + i + " does not have a name property.");
                            continue;
                        }
                        var which = missions.where({ name : missionsData[i].name });

                        if (!which || which.length == 0 || which.length > 1) {
                            console.error("Mission named " + missionsData[i].name + " has either 0 or multiple corresponding missions in the configuration file.");
                            continue;
                        }

                        
                        
                        which[0].set(missionsData[i]);
                    }
                    
                    _.each(saveData, function(value, key) {
                        self.set(key, value);
                    });

                    console.log(app.get('cutscenesPlayed'));
                }
                _.delay(function() {
                    app.trigger('load');
                    app.menu();
                }, 2000);
               

            });
        });
    },

    /*
     * Save data to server.
     */
    saveMissionData: function() {
        var self = this;
        var saveData = {};

        if (this.mission().get('nosave'))
            return;
        
        _.each(this.saveKeys, function(key) {
            this[key] = self.get(key);
        }, saveData);

        var dataDict = {
            missions: app.get('missions'),
            saveData: saveData
        };
        
        var data = JSON.stringify(dataDict);
        var earned_stars = app.starsEarnedTotal();
        app.trigger('saving');
        $.post('php/gamedata.php?action=save', {
            data:data,
            earned_stars:earned_stars
        }).done(function(data) {
            app.trigger('saved', data);
        });
        return dataDict;
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
        else {
            var l = app.get('missions').where({ name: which });
            if (l.length > 1)
                console.error("Warning, multiple missions with name ", name);
            return l[0];
        }
    },

    
    animateUntil: function(event, f, cancel, wait) {
        wait = wait || 0;
        var listener = _.extend({}, Backbone.Events);
        var stop = false;
        listener.listenTo(this, event, function() {
            stop = true;
            listener.off();
            _.defer(cancel);
        });

        
        var f2 = function() {
            if (!stop) {
                f();
                requestAnimationFrame(f2);
            }
        };

        _.delay(f2, wait);
    },

    massRanges: {
        Earth: 1,
        Neptune: 17,
        Jupiter: 300
    },

    massLabel: function(mass) {
        mass = mass * Units.MSUN / Units.MEARTH;
        if (mass < 17)
            return mass.toFixed(1) + " x Earth";
        else if (mass < 318)
            return (mass / 17).toFixed(1) + " x Neptune";
        else
            return (mass / 318).toFixed(1) + " x Jupiter";
    },

    albedo: Math.pow(1-0.3, 0.25),
    temperatureForDistance: function(r, albedo) {
        albedo = albedo || this.albedo;
        return Units.TEMPSUN * albedo * Math.sqrt(Units.RSUN / Units.RUNIT * 1./(2. * r)) - 273.15;        
    },
    
    getHumanInfoForBody: function(body, ret) {
        if (body < 0)
            return {};
        ret = ret || {};
        body += 1;
        var position = this.get('position');
        var r = Math.sqrt((position[X]-position[body*NPHYS+X])*(position[X]-position[body*NPHYS+X]) +
                          (position[Y]-position[body*NPHYS+Y])*(position[Y]-position[body*NPHYS+Y]) +
                          (position[Z]-position[body*NPHYS+Z])*(position[Z]-position[body*NPHYS+Z]));
        ret.distance = (r * Units.RUNIT / (1e11)).toFixed(1) + " million km";
        if (ret.distanceOnly) {
            return ret;
        }
        
        var velocity = this.get('velocity');
        var v = Math.sqrt((velocity[X]-velocity[body*NPHYS+X])*(velocity[X]-velocity[body*NPHYS+X]) +
                          (velocity[Y]-velocity[body*NPHYS+Y])*(velocity[Y]-velocity[body*NPHYS+Y]) +
                          (velocity[Z]-velocity[body*NPHYS+Z])*(velocity[Z]-velocity[body*NPHYS+Z]));
        ret.speed = (v * Units.RUNIT / Units.TUNIT / (1e5)).toFixed(1) + " km/s";

        var T = this.temperatureForDistance(r);
        var Tlabel;
        if (T < 0)
            Tlabel = '&#10052; Freezing';
        else if (T > 100)
            Tlabel = '&#9728; Boiling';
        else
            Tlabel = '&#9786; Liquid water';
        
        var period;
        if (app.get('state') == PAUSED) {
            period = '';
        } else {
            var els = this.elements();
            period = els[body-1].period;
            if (isNaN(period)) {
                period = 'Ejected';
            } else {
                var time = this.get('time');
                period = Math.min(period, time).toFixed(1) + " days";                
            }
        }
        var M = this.massForBody(body-1);
        var mass = this.massLabel(M);

        ret.period = period;
        ret.mass = mass;
        ret.massSliderVal = Math.log10(M * Units.MSUN/Units.MEARTH) * 100;
        ret.temperature = Tlabel + " (" + T.toFixed(0) + " &deg;C)";
        return ret;
    },
    
    /*
     * Initializes the model, by creating a "context" object. The context
     * object is used by the leapfrog function.
     */
    initialize: function() {
        var self = this;
        this.ctx = {M:this.get('masses'), x: this.get('position'), v:this.get('velocity'), dt: 0.25 };
        this.listenTo(this, "planet:drag planet:dragvelocity", function() { this.elements(true); });

        if (!this.ctx.M)
            console.error('');
        
        this.listenTo(this, "change:state", function() {
            if (self.get('state') == PAUSED)
                app.trigger('state:paused');
            else if (self.get('state') == RUNNING) {
                app.trigger('state:running');
            }
            else if (self.get('state') == ROTATABLE)
                app.trigger('state:rotatable');
            else if (self.get('state') == MENU)
                app.trigger('state:menu');
        });
        
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
    events: UI.makeEventTable({
        "click #menu": function() { $("#sidebar").toggleClass("expanded"); },
        "click #help": function() { app.mainView.renderMission(true); app.trigger('hint'); },
        "click #practice": function() { app.setMission('sandbox'); },
        "click #reset": function() { app.reset(); },
        "click #missions": function() { app.menu(); },
        "click #sizes": function() { app.set('physicalSizes', !app.get('physicalSizes')); },
        "click #forces": function() { app.flags.disabledForce = !app.flags.disabledForce; app.trigger('refresh'); },
        "click #zoom-in": function() { draw.setZoom(draw.zoom*2, true); },
        "click #zoom-out": function() { draw.setZoom(draw.zoom/2, true); },
        "click #speed-up": function() { draw.setSpeed(SPEED * 2); },
        "click #speed-down": function() { draw.setSpeed(SPEED / 2); },        
        "click #zoom": function() { this.setToolbarVisible($("#toolbar-zoom")); },
        "click #reset-initial": function() { app.resetToInitial(); },
        "click #random": function() { app.random(); },
        "click #mass-selector": function() { if (app.get('state') == PAUSED) this.setToolbarVisible($("#toolbar-masses")); },
        "click #dashboard": function() { location.href = "/"; }
        
    }),

    // Binds functions to change events in the model.
    initialize: function() {
        var self = this;

        
        
        // Update information when planetary parameters change
        self.listenTo(self.model, 'change:nplanets change:time change:position change:velocity change:elements change:selectedPlanet', _.throttle(self.renderInfo, 600));
        self.listenTo(self.model, 'change:masses', self.renderInfo);
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

            var els = app.elements();
            var deltat = app.get('deltat');
            var Pmin = _.reduce(els, function(memo, el) {
                return Math.min(memo, el.period);
            }, 1e10);
            var emax = _.reduce(els, function(memo, el) {
                return Math.max(memo, el.eccentricity);
            }, 0);
            

            var secs = 7000;
            if (app.get('collided') || emax > 0.99)
                secs = Pmin/4; // temporary

            if (! isNaN(Pmin)) {
                secs = Pmin / deltat * (1/60) * 1000;
            }
            app.once("change:collided", function() {
                self.validate();
            });
            
            var wait = Math.min(secs, 2500);
            console.log("Waiting ", secs, "before validation");
            self.validateTimer = _.delay(_.bind(self.validate, self), wait);
        });

        $('#mass-slider').rangeslider({ polyfill: false });
        
        $('#mass-slider').on('change', function(a, b, c) {
            var idx = app.get('selectedPlanet')-1;
            var mass = Math.pow(10, $(this).val()/100) | 0;
            app.setMassForBody(idx, mass * Units.MEARTH/Units.MSUN);
        });

        $('.toolbar .close').on(UI.clickEvent, function() {
            self.setToolbarVisible($(this).parents('.toolbar'));
        });

        $(".planet").on(UI.clickEvent, function() {
            app.set('selectedPlanet', $(this).data('n'));
        });

        $("#share-url").on("keyup keypress focus change select", function() {
            this.select();
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
    
    /*
    renderTopText: function(text, hide) {
        if (!app.loaded)
            return;
        
        $("#text-top").html(text);
        $("#text-top").addClass("expanded");
        $("#text-top").removeClass("in-front");

        $("#sidebar").hide();
        $("#help-text").removeClass("expanded");
        $("#info-top").hide();
        draw.fly();
        app.set('interactive', false);
        
        if (this.topHideTimer)
            clearTimeout(this.topHideTimer);

        console.log('interactive', app.get('interactive'));
        this.topHideTimer = _.delay(function() {
            $("#text-top").removeClass("expanded");
            $("#text-top").removeClass("in-front");
            if (app.get('state') != MENU) {
                $("#sidebar").show();
                $("#info-top").show();
            }

            app.set('interactive', true);
            console.log('interactive', app.get('interactive'));
            app.trigger('startLevel');
        }, this.missionDelay);
    },*/

    missionTemplate: _.template('<div class="title"><%= title %></div><div class="subtitle"><%= subtitle %></div>'),
    missionDelay: 5000,
    missionQuickDelay: 2000,

    setToolbarVisible: function($toolbar, visible) {        
        if (visible === undefined || visible === 'toggle') {
            $toolbar.toggleClass("expanded").toggleClass("hidden");
        } else if (visible) {
            $toolbar.addClass("expanded").removeClass("hidden");
        } else {
            $toolbar.removeClass("expanded").addClass("hidden");
        }
    },
    
    renderMission: function(hint) {
        // Check if the top banner is already expanded; if it is, hide it
        // temporarily and show it again.
        if (app.get('state') != PAUSED || !app.loaded || this.missionBannerShowing)
            return;
        var current = this.model.get('currentMission');
        var mission = this.model.get('missions').at(current);
        
        $("#text-top").html(this.missionTemplate(mission.attributes));
        $("#text-top").addClass("expanded");
        $("#text-top").removeClass("in-front");

        $("#sidebar").hide();

        if (!hint) {
            if (window.draw)
                draw.fly();
            app.set('interactive', false);
            $("#help-text").removeClass("expanded");
            $("#info-top").hide();
        }


        var delay = this.missionDelay;
        if (this.lastMission == mission)
            delay = this.missionQuickDelay;

        this.lastMission = mission;
        this.missionBannerShowing = true;

        var self = this;
        this.missionHideTimer = _.delay(function() {
            if (app.get('state') != MENU) {
                self.setVisibility();
            }

            $("#text-top").removeClass("expanded");
            $("#text-top").removeClass("in-front");
            
            if (!hint) {
                app.set('interactive', true);
                app.trigger('startLevel');
            }
            
            self.missionBannerShowing = false;
        }, delay);

        if (mission.get('powers')) {
            var activePowers = app.get('activePowers');
            _.each(mission.get('powers'), function(power) {
                if (activePowers.indexOf(power) < 0)
                    activePowers.push(power);
                $('html').addClass(power);
            });
            
        }
        
    },

    els: {},
    renderInfoDisabled:false,
    info: {},
    
    /*
     * Fills the table on the top-right hand side with the relevant information. renderInfo is
     * throttled so it is only updated once per second (or so).
     *
     * For now, it displays time (in days), the distance from the central star (in 10^8 km),
     * and the speed (in km/s).
     */    
    renderInfo: function(a) {
        if (this.renderInfoDisabled) {
            this.renderInfoDisabled = false;
            return;
        }
            
        for (var i = 0; i < app.get('nplanets'); i++) {
            $("#planet-" + (i+1)).css('display', (i < app.get('nplanets') ? 'inline' : 'none')).css("background-color", draw.color(TYPE_PLANET, i)).removeClass("planet-selected");
        }
        $(".change").hide();
        if (app.get('nplanets') > 0) {
            var idx = app.get('selectedPlanet')-1;
            var info = app.getHumanInfoForBody(idx, this.info);
            
            $("#distance").html(info.distance);
            $("#speed").text(info.speed);
            $("#period").text(info.period);
            $("#mass").text(info.mass);
            $("#mass-selector").show();
            $("#temperature").html(info.temperature);
            $("#temperature-label").html(info.temperatureLabel);
            $(".val-planet").css("color", draw.color(TYPE_HALO, idx));
            $("#planet-" + (idx+1)).addClass("planet-selected");
            $("#mass-slider-container .rangeslider__fill").css('background-color', draw.color(TYPE_PLANET, idx));
            if (idx >= 0) {
                this.renderInfoDisabled = true;
                $("#mass-slider").val(info.massSliderVal).change();
                
                if (app.get('state') == PAUSED)
                    $(".change").show();
            }
        } else {
            $("#distance").text("");
            $("#speed").text("");
            $("#eccentricity").text("");
            $("#period").text("");
            $("#mass-selector").hide();
            $("#temperature").html("");
            $("#temperature-label").html("");
            $(".planet").css("display", "none");
        }
    },

    /*
     * When the user is shown the mission menu, fade away all the UI elements that could be distracting.
     */
    setVisibility: function() {
        var state = app.get('state');

        if (state == MENU || app.mission().get('hideui')) {
            $("#sidebar").hide();
            $("#sidebar").removeClass("expanded");
            $("#help-text").removeClass("expanded");
            $("#help-text").removeClass("large");
            
            $("#info-top").hide();
            $("#help").hide();
            $("#text-top").removeClass("expanded");
        } else {
            $("#sidebar").show();
            $("#info-top").show();
            $("#help").show();
        }
        if (state != MENU)
            $("#info-top").show();

        _.each(STATES, function(stateToRemove) {
            $("html").removeClass("state-" + stateToRemove);
        });
        $("html").addClass("state-" + state);

        
        if (state != PAUSED)
            this.setToolbarVisible($("#toolbar-masses"), false);
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
        if (!app.mission().get('rule'))
            return;
        var f = app.mission().get('rule')();
        if (f) {
            this.model.win();
        } else {
            this.model.lose();
        }
        clearInterval(this.validateTimer);
    },

    /*
     * Render win.
     */
    
    renderWin: function() {
        app.set('state', ROTATABLE);        
    },
    
    renderLose: function() {        
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
        this.trigger('help', null);
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
        this.listenToOnce(this.model, "load", function() {
            this.setupTemplates();
        });
        
        this.listenTo(this.model, "start resetmessages", function() {
            this.render(null);
            this.setupMessages();
        });
        
        this.listenTo(this.model, "win lose", function() { self.render(null); });
        var self = this;
        $("#help-next").on(UI.clickEvent, function() { self.model.proceed(); });
    },


    
    setupTemplates: function() {
        if (this.messagesSetup)
            return;

        var self = this;
        var missions = this.model.get('missions');
        var id = 0;

        for (var i = 0; i < missions.length; i++) {
            var m = missions.at(i);
            var help = m.get('help');
            if (!help) 
                help = [];

            var events = _.pluck(help, 'on');
            if (! _.contains(events, 'win') && ! _.contains(events, 'win1') && ! _.contains(events, "win2") && !_.contains(events, "win3")) {
                help.push({ on: 'win', message: "" });
                console.warn(m.get('name'), 'does not have a win message.');
            }
            if (! _.contains(events, 'lose')) {
                help.push({ on: 'lose', message: "" });
                console.warn(m.get('name'), 'does not have a lose message.');                
            }
            
            for (var j = 0; j < help.length; j++) {
                app.templates.template(help[j], m);
                help[j].id = id;
                id++;
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
        var self = this;
        this.listener = new MissionHelpModel({ model:this.model });
        this.listenTo(this.listener, 'help', this.render);
        this.listenTo(this.model, 'help', this.render);
        this.listener.setup();
        this.proceed = function() {
            self.listener.proceed();
        };
    },

    plainText: function(txt) {
        return txt.replace(/<script.+?<\/script>/, '').replace(/<button.+?<\/button>/, '').replace(/<.+?>/g, '').replace(/&.+;/g, '');
    },

    shown: {},
    
    render: function(help) {
        var helpText = (help ? help.message : null);
        
        var self = this;
        if (helpText && self.lastHelp == helpText) {
            $("#help-text").removeClass("large");
            $("#help-text").addClass("expanded");

            return;
        }

        if (help != null && help.showOnce && this.shown[help.id]) {
            helpText = null;
        }
        
        self.lastHelp = helpText;
        
        _.defer(function() {
            if (help && help.funcs)
                for (var i = 0; i < help.funcs.length; i++)
                    help.funcs[i]();
        });
        
        $("#help-text").removeClass("expanded");
        $("#help-text").removeClass("large");
            
        if (!helpText) {
            $("#help-body").html("");
            return;
        }

        if (help.script)
            eval(help.script);
        
        _.delay(function() {
            self.$el.html(helpText);
            self.shown[help.id] = true;
            var plainText = self.plainText(helpText);
            $("#help-next").on(UI.clickEvent, function() { self.listener.proceed(); } );
            $("#help-close").on(UI.clickEvent, function() { self.hide(); });
            $("#help-next-mission").on(UI.clickEvent, function() { self.model.nextMission(); } );
            $(".player-name").text(app.get('playerName'));
            
            $("#help-text").addClass("expanded");
            $("#help-text").removeClass("large");
                        
            app.trigger('show:help');
            app.mainView.renderInfo();
            if (help && help.funcs)
                for (var i = 0; i < help.funcs.length; i++)
                    help.funcs[i]();
        }, 200);
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
    animate: false,
    size: 10,
    
    initialize: function() {
        this.listenTo(this.model, "loading", this.renderLoading);
        this.listenTo(this.model, "load sampled", this.renderLoad);
        this.frame = _.bind(this.frame, this);
    },

    loadingMessage: '<div class="orbits-loading"><img src="img/logo.png"><div class="flash">Traveling to the <%= world %>...</div></div><i class="fa fa-circle-o-notch fa-spin"></i>',

    frame: function() {
        this.size = this.size * 1.01;
//        $("#app-modal").css("background-size", this.size + "%");
        
        if (this.animate)
            requestAnimationFrame(this.frame);
    },
    
    renderLoading:function() {
        var map = app.get('map');
        this.animate = true;
        this.size = 10;
        
//        $("#app-modal").css("background-image", "url(" + map[0]['travel-bg'] + ")");
//        $("#app-modal").css("background-size", "10%");
        $("#app-modal").html(_.template(this.loadingMessage)(map[0]));

        $("#app").hide();
        this.$el.show();
        requestAnimationFrame(this.frame);
    },

    loadedEvents: 0,
    renderLoad: function() {
        $("#app").show();
        this.animate = false;
        this.$el.hide();
    }
});

$(window).load(function() {
    app.mainView = new AppView({ model: app });
    
    // APP_CFG is an object created statically by the backend and inserted in
    // a top-level <script> tag. This is done so that the model does not have to
    // fetch it asynchronously from a .json file.
    // APP_CFG replicates the configuration options contained in app.yaml: e.g.,
    // mission text and objectives.
    app.loadConfig(APP_CFG);

    app.templates = new Templates();
    app.messageView = new MessageView({ model: app });
    app.menuView = new AppMenuView({model: app});
    app.modalView = new AppModalView({model:app});
    app.settings = new AppSettings({ model:app });
    
    app.loadMissionData();
    app.sounds = new SoundEngine(app);

    APP_CFG = null;

    app.once('load', function() {
        app.sounds.playMusic('level');
        app.loaded = true;

        if (_.parameter('mission') != null) {
            var mission = _.parameter('mission');
            _.defer(function() {
                app.setMission(mission);
            });

            if (mission == 'gravitykit') {
                app.urlShare();
                app.on("change:state", function() {
                    if (app.get('state') == RUNNING)
                        app.set('state', ROTATABLE);
                });
            }
        }
    });

       
});

if (_.parameter('mission') != null)
    $('html').addClass(_.parameter('mission'));

 

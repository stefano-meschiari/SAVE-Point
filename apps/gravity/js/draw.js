// Number of stars
STARS = 50;
CANVAS_ID = 'canvas';
MAX_SEGMENTS = 700;

var Draw = Backbone.View.extend({
    backgroundStars:[],
    animating:false,

    recalculateSizes: function() {
        // Number of pixels corresponding to 1 length unit (1 AU)
        PIXELS_PER_AU = 200;
        // Number of pixels corresponding to 1 speed unit (1 AU/day)
        PIXELS_PER_AUPDAY = 100 / Math.sqrt(K2);
        // Size of arrow
        ARROW_SIZE = 15;
        ARROW_DRAG_SIZE = 50;

        var physicalSizes = app.get('physicalSizes');

        if (!physicalSizes) {
        
            // Size of central star
            STAR_SIZE = 40 * Units.RSUN / Units.AU * PIXELS_PER_AU;
            // Size of planets
            PLANET_SIZE = 2*STAR_SIZE * 1.5 * Units.RJUP/Units.RSUN;
            
            // By default, minimum distance is the "cartoon" size of the star.
            
        } else {
            STAR_SIZE = Math.max(2, Units.RSUN / Units.AU * PIXELS_PER_AU);
            PLANET_SIZE = Math.max(2, Units.RJUP / Units.AU * PIXELS_PER_AU);
            
        }

        app.set('minAU', STAR_SIZE / PIXELS_PER_AU);
        // Star halo size
        STAR_HALO_SIZE = Math.max(3*STAR_SIZE, 70);


        PLANET_HALO_SIZE = Math.max(25, 2*PLANET_SIZE);
        // Size of planet when dragging
        PLANET_DRAG_SIZE = Math.max(25, 2*PLANET_SIZE);
        PLANET_HALO_DRAG_SIZE = 1.1*PLANET_DRAG_SIZE;
    },
    
    createBackgroundStars: function() {
        var path = new Path.Circle(new Point(x, y), 2);
        path.fillColor = 'rgba(255, 255, 255, 0.5)';

        var symbol = new Symbol(path);

        for (var i = 0; i < 2*STARS; i++) {
            var x = 2*view.bounds.width*Math.random();
            var y = view.bounds.height*Math.random();
            var z = 0.75 * Math.random();
            var s = symbol.place(new Point(x, y));
            s.z = z;
            this.backgroundStars.push(s);
        }
    },

    displayMessage: function(text, options) {
        options = options || {};
        options.color = options.color || COLOR_MESSAGE;
        options.font = options.font || FONT_MESSAGE;
        options.y = options.y || 100;

        console.log(options);
        var textItem = new PointText(new Point(view.center.x, options.y));

        textItem.fillColor = options.color;
        textItem.fontFamily = options.font.fontFamily;
        textItem.fontSize = options.font.fontSize;
        textItem.fontWeight = options.font.fontWeight;
        textItem.justification = 'center';
        textItem.content = text;
    },

    animateCollision: function(info) {
        var colorIndex = app.get('currentMission');
        var smokeColor = PLANET_COLORS[colorIndex];
        var self = this;

        this.planets[0].visible = false;
        
        var frame = 0;
        var frames = 60;
        var explosionSize = 100;

        var x = info.x * PIXELS_PER_AU + this.star.position.x;
        var y = info.y * PIXELS_PER_AU + this.star.position.y;

        var pos = new Point(x, y);
        var smoke = new Path.Circle(pos, 1);
        smoke.fillColor = smokeColor;
        smoke.opacity = 1;

        this.bobStar();
        this.animations.push(function() {

            smoke.opacity = Math.pow((frames-frame)/frames, 1);
            var size = Math.floor(explosionSize*Math.pow((frame)/frames, 1)+1);
            
            smoke.bounds.width = size;
            smoke.bounds.height = size;
            smoke.position = pos;
            
            frame++;
            if (frame > frames) {
                smoke.remove();
                return false;
            }
            else
                return true;
        });
    },
    
    animateTravel: function() {
        var self = this;
        this.animating = true;

        var direction = 1;//(app.previous('currentMission') < app.get('currentMission') ? 1 : -1);
        
        app.set('state', PAUSED);

        var frame = 0;
        var frames = 300;
        var Dx = 2*view.bounds.width * direction;

        // function: dx = x * (x-frames) * 6 * Dx / frames^3
        var a = 6*Dx / (frames*frames*frames);
        var scale = Math.pow(0.1, 4./(frames));
        var scaleStar = true;

        this.destroyHandles();
        this.destroyTrails();
               
        this.animations.push(function() {
            app.set('interactive', false);
            
            var dx = frame * (frames-frame) * a;
            
            if (frame == frames) {
                app.set('interactive', true);
                self.animating = false;
                self.star.center = view.center;
                _.delay(_.bind(self.animateStar, self), 1000);
                return false;
            } else if (frame == (0.5*frames)|0) {
                self.star.bounds.width = 5;
                self.star.bounds.height = 5;
                scaleStar = false;
                self.star.position.x = 1.5*view.bounds.width;
                self.star.position.y = view.center.y;

            } else if (frame > (0.5*frames)|0) {
                if (self.star.position.x < view.center.x)
                    self.star.position.x = view.center.x;
            }

            
            self.star.position.x -= dx;
            self.star.halo.position.x = self.star.position.x;
            
            if (scaleStar) {
                self.star.scale(scale);
                self.star.halo.scale(scale);
            }
            
            var i;
            for (i = 0; i < self.planets.length; i++) {
                self.planets[i].position.x -= dx;
                self.planets[i].scale(scale);
            }
            for (i = 0; i < self.backgroundStars.length; i++) { 
                self.backgroundStars[i].position.x -= dx * self.backgroundStars[i].z * self.backgroundStars[i].z;
                if (self.backgroundStars[i].position.x < 0) {
                    self.backgroundStars[i].position.x = view.bounds.width;
                    self.backgroundStars[i].position.y = Math.floor(Math.random() * view.bounds.height);
                }
            }
            
            
            frame++;
            return true;
        });
    },

    animateTap: function() {
        
    },


    restoreSizes: function() {
        for (var i = 0; i < this.planets.length; i++) {
            var body = this.planets[i];
            if (!body.dragging) {
                var center = body.bounds.center;
            
                body.bounds.size = new Size(2*PLANET_SIZE , 2*PLANET_SIZE);
                body.bounds.center = center;
            }
            if (this.handles.length > i && !body.dragging) {
                this.handles[body.planetIndex].halo.bounds.size = new Size(2*PLANET_HALO_SIZE, 2*PLANET_HALO_SIZE);
                this.handles[body.planetIndex].halo.bounds.center = center;
            }
            
            if (this.handles.length > i && !this.handles[i].vector.dragging) {
                var vector = this.handles[i].vector;
                center = vector.head.bounds.center;
                vector.head.bounds.size = new Size(2*ARROW_SIZE, 2*ARROW_SIZE);
                vector.head.bounds.center = center;
            }
        }
    },
    
    createArrow: function(from, to, color) {
        color = color || COLOR_OUTLINE;
        var myPath = new Path.Line(from, to);
        var t = Math.atan2(to.y-from.y, to.x-from.x) * 180/Math.PI;
        var head = new Path.RegularPolygon(to, 3, ARROW_SIZE);
        
        head.fillColor = color;
        myPath.strokeColor = color;
        myPath.strokeWidth = 3;
        head.rotate(t-30);
        var g = new Group([myPath, head]);
        g.last = t;
        g.head = head;

        g.setVector = function(from, to) {
            myPath.segments[0].point = from;
            myPath.segments[1].point = to;
            var t = Math.atan2(to.y-from.y, to.x-from.x) * 180/Math.PI;
            if (t != g.last) {
                head.rotate(-(g.last-30));
                head.rotate(t-30);
                head.position = to;           
            } else {
                head.position = to;
            }
            
            g.last = t;
        };
        return g;
    },
    
    starUpdate: function(position) {
        this.star.halo.position.x = this.star.position.x = view.center.x + position[X] * PIXELS_PER_AU;
        this.star.halo.position.y = this.star.position.y = view.center.y + position[Y] * PIXELS_PER_AU;
    },
    
    planetsUpdate: function() {
        if (!app.get('interactive'))
            return;
        
        var colorIndex = app.get('currentMission');
        var color = new window.Color(PLANET_COLORS[colorIndex]);
        var self = this;
        
        var position = app.get('position');
        var planets = this.planets;
        var nplanets = app.get('nplanets');
        if (nplanets == 0) {
            this.destroyPlanets();
            return;
        }
        
        var i;
        if (nplanets != planets.length) {
            if (nplanets > planets.length) {
                for (i = planets.length; i < nplanets; i++) {
                    var body = new Path.Circle({
                        center: view.center,
                        radius:PLANET_SIZE 
                    });
                    body.fillColor = {
                        gradient: {
                            stops:[[PLANET_COLORS[colorIndex], 0.], ['black', 0.85]],
                            radial:true
                        },
                        origin: body.position,
                        destination: body.bounds.rightCenter
                    };
                    this.planets.push(body);
                    
                    body.planetIndex = i;

                    var drag = function(event) {
                        var point = event.point;
                        var bsize = body.bounds.width;
                        if (point.x - bsize < 0 ||
                            point.y - bsize < 0 ||
                            point.x + bsize > view.bounds.width ||
                            point.y + bsize > view.bounds.height ||
                            document.elementFromPoint(point.x-bsize, point.y-bsize).id !== CANVAS_ID ||
                            document.elementFromPoint(point.x+bsize, point.y+bsize).id !== CANVAS_ID ||
                            document.elementFromPoint(point.x, point.y).id !== CANVAS_ID)
                        {
                            body.dragging = false;
                            return;
                        }

                        if (!body.dragging)
                            body.mouseDown();
                        
                        body.dragging = true;

                        var c = [point.x - self.star.position.x, point.y - self.star.position.y, 0];
                        c[0] /= PIXELS_PER_AU;
                        c[1] /= PIXELS_PER_AU;
                        app.setPositionForBody(body.planetIndex, c);
                    };

                    var mouseDown = function() {
                        var center = body.bounds.center;
                        body.bounds.size = new Size(2*PLANET_DRAG_SIZE, 2*PLANET_DRAG_SIZE );
                        body.bounds.center = center;
                        self.handles[body.planetIndex].halo.bounds.size = new Size(2*PLANET_HALO_DRAG_SIZE, 2*PLANET_HALO_DRAG_SIZE);
                        self.handles[body.planetIndex].halo.bounds.center = center;

                    };

                    var mouseUp = function() {
                        if (body.dragging)
                            app.trigger("planet:drag");
                        body.dragging = false;
                        self.restoreSizes();                        
                    };
                    
                    body.drag = drag;
                    body.mouseDown = mouseDown;
                    body.mouseUp = mouseUp;
                    
                    body.on("mousedrag", body.drag);
                    body.on("mousedown", body.mouseDown);
                    body.on("mouseup", body.mouseUp);                  
                }
                
            } else {
                for (i = nplanets; i < planets.length; i++) {
                    planets[i].visible = false;                    
                }
            }
        }

        var star = this.star;
        for (i = 0; i < nplanets; i++) {
            var planet = planets[i];

            planet.position.x = view.center.x + position[NPHYS*(i+1)+X] * PIXELS_PER_AU;
            planet.position.y = view.center.y + position[NPHYS*(i+1)+Y] * PIXELS_PER_AU;
            var dx = planet.position.x - star.position.x;
            var dy = planet.position.y - star.position.y;

            var angle = Math.atan2(dy, dx);
            var w = planet.bounds.width;
//            var lightFactor = Math.max(2*(dx*dx + dy*dy)/(view.bounds.width * view.bounds.width), 0.1);
//            planet.fillColor.components[0].stops[0].color = color.darken(lightFactor).rgbString();
            
            planet.fillColor.origin = new Point(planet.position.x - 0.5*w*Math.cos(angle),
                                                planet.position.y - 0.5*w*Math.sin(angle));
            planet.fillColor.destination = new Point(planet.position.x + 0.5*w*Math.cos(angle),
                                                     planet.position.y + 0.5*w*Math.sin(angle));
        }
    },

    handlesUpdate: function() {
        if (!app.get('interactive'))
            return;
        
        if (app.get('state') != PAUSED) {
            if (this.handles.length != 0)
                this.destroyHandles();
            return;
        }

        var position = app.get('position');
        var velocity = app.get('velocity');
        var nplanets = app.get('nplanets');
        var handles = this.handles;
        var self = this;
        var i = 0;
        var colorIdx = app.get('currentMission');

        
        if (handles.length == 0 || handles.length != nplanets) {
            this.destroyHandles();

            for (i = 0; i < nplanets; i++) {
                var body = this.planets[i];
                var halo = new Path.Circle({
                    center: body.position,
                    radius: PLANET_HALO_SIZE
                });

                var haloColor = window.Color(PLANET_COLORS[colorIdx]).lighten(0.2).rgbString();
                
                halo.fillColor =  {
                    gradient: {
                        stops:[[haloColor, 0.6], ['rgb(0, 0, 0, 0)', 1]],
                        radial:true
                    },
                    origin: body.position,
                    destination: halo.bounds.rightCenter
                };
        

                halo.on("mousedrag", body.drag);
                halo.on("mouseDown", body.mouseDown);
                halo.on("mouseUp", body.mouseUp);
                
                halo.insertBelow(body);

                var dv = new Point(velocity[NPHYS*(i+1)+X], velocity[NPHYS*(i+1)+Y]);
                
                var vector = this.createArrow(body.position, body.position + dv * PIXELS_PER_AUPDAY,
                                             haloColor);
                vector.insertBelow(body);


                var dragFunction = function(event) {
                    vector.dragging = true;
                    c = [event.point.x - body.position.x, event.point.y - body.position.y, 0];
                    c[0] /= PIXELS_PER_AUPDAY;
                    c[1] /= PIXELS_PER_AUPDAY;
                    app.setVelocityForBody(body.planetIndex, c);
                };
                vector.on("mousedrag", dragFunction);
                vector.on("mousedown", function(event) {
                    var center = vector.head.bounds.center;
                    vector.head.bounds.size = new Size(ARROW_DRAG_SIZE, ARROW_DRAG_SIZE);
                    vector.head.bounds.center = center;
                });
                vector.on("mouseup", function(event) {
                    app.trigger("planet:dragvelocity");
                    vector.dragging = false;
                    self.restoreSizes();                    
                });
                
                handles.push({halo:halo, vector:vector});
            }
        }

        for (i = 0; i < nplanets; i++) {

            var vx = velocity[NPHYS*(i+1)+X] * PIXELS_PER_AUPDAY;
            var vy = velocity[NPHYS*(i+1)+Y] * PIXELS_PER_AUPDAY;

            handles[i].halo.position = this.planets[i].position;
            handles[i].vector.setVector(this.planets[i].position, this.planets[i].position +
                                        new Point(vx, vy));
        }
    },

    destroyHandles: function() {
        var handles = this.handles;
        for (var i = 0; i < handles.length; i++) {
            handles[i].halo.remove();
            handles[i].vector.remove();
        }
        handles.length = 0;
    },

    tick: 0,

    trailsUpdate: function() {
        if (!(app.get('state') == RUNNING || app.get('state') == MENU))
            return;

        var planets = this.planets;
        if (planets.length == 0)
            return;
        if (this.trailThetaTotal > 2.*Math.PI)
            return;
        
        var planet = planets[0];
        var star = this.star;
        var tc = this.trailSegments;

        this.tick ++;
        
        if (tc.length > MAX_SEGMENTS || this.tick % 2 != 0)
            return;
        
        var lastPos;
        var position = app.get('position');
        var theta = Math.atan2(position[NPHYS+Y], position[NPHYS+X]);
        
        if (tc.length == 0) {
            lastPos = planet.position;
            var colorIdx = app.get('currentMission');
            this.trailColor = window.Color(PLANET_COLORS[colorIdx]).lighten(0.2).rgbString();
            this.trailLastTheta = theta;
            this.trailThetaTotal = 0;
        }
        else
            lastPos = tc[tc.length-1].lastSegment;

        var dt = Math.abs(this.trailLastTheta - theta);
        if (2 * Math.PI - dt < dt)
            dt = 2 * Math.PI - dt;
        this.trailLastTheta = theta;
        this.trailThetaTotal += dt;
        
        var els = this.model.get('elements');

        var a = els[0].sma;
        var e = els[0].eccentricity;
        var r = position[NPHYS+X]*position[NPHYS+X] + position[NPHYS+Y]*position[NPHYS+Y];
        
        var path = new Path(lastPos, planet.position);
        path.strokeWidth = 3;
        path.strokeColor = this.trailColor;
        path.opacity = Math.max((a * a * (1-e) * (1-e))/r, 0.4);
        path.insertBelow(planets[0]);
        tc.push(path);
    },

    destroyTrails: function() {
        for (var i = 0; i < this.trailSegments.length; i++) 
            this.trailSegments[i].remove();
        this.trailSegments = [];
        this.trailThetaTotal = 0;
    },

    
    /*
    trailsUpdate: function() {
        this.destroyTrails();
        var els = this.model.elements();
        var np = this.model.get('nplanets');
        
        for (var i = 0; i < np; i++) {
            var a = els[i].sma;
            var e = els[i].eccentricity;
            var lop = els[i].longPeri;

            var p = (e < 1 ? 1 : 1) * a * (1-e*e);
            var path = new Path();
            
            for (var t = 0; t <= 2*Math.PI; t += 2*Math.PI/100) {
                var r = p/(1+e*Math.cos(t - lop));
                if (r < 0)
                    continue;
                path.addSegment(new Point(r * Math.cos(t) * PIXELS_PER_AU + view.center.x, r * Math.sin(t) * PIXELS_PER_AU + view.center.y));
            }

            if (e < 0.99) {
                path.smooth();
                path.closed = true;
            }
            path.strokeColor = ORBIT_COLORS[app.get('currentMission')];
            path.sendToBack();
            this.trails[i] = path;
        }
    },*/
    
    
    destroyPlanets: function() {
        this.destroyTrails();

        var planets = this.planets;
        for (var i = 0; i < planets.length; i++)
            planets[i].remove();
        planets.length = 0;
    },

    
    validatePlanet: function() {
        
    },

    animationsTick: function() {
        for (var i = this.animations.length-1; i >= 0; i--) {
            if (!this.animations[i]())
                this.animations.splice(i, 1);
        }
    },


    animateStar: function() {
        var start = 5;
        var N = 100;
        var dx = (2*STAR_SIZE-start)/N;
        var i = 1;
        var star = this.star;
        this.animations.push(function() {
            if (i == N)
                return false;
            star.bounds.width = i*dx + start;
            star.bounds.height = i*dx + start;
            star.halo.bounds.width = (i*dx+start) * STAR_HALO_SIZE/STAR_SIZE;
            star.halo.bounds.height = (i*dx+start) * STAR_HALO_SIZE/STAR_SIZE;
            
            star.position = view.center;
            star.halo.position = view.center;
            i++;
            return true;
        });
    },


    bobStar: function() {
        var i = 0;
        var fr = 20;
        var star = this.star;
        
        this.animations.push(function() {
            if (i == fr)
                return false;

            star.bounds.width = STAR_SIZE  * (2 + 0.2 * Math.sin(Math.PI*i/fr));
            star.bounds.height = STAR_SIZE  * (2 + 0.2 * Math.sin(Math.PI*i/fr));
            star.position = view.center;
            i++;
            return true;
        });
    },
    
    update: function() {
        this.animationsTick();

        if (this.animating)
            return;
        
        var position = app.get('position');
        this.starUpdate(position);
    },

    resize: function() {
        if (this.animating)
            return;
        
        this.update();
        this.destroyTrails();
        this.planetsUpdate();
        this.handlesUpdate();

    },
    
    // Mouse-down event on canvas. Forward message to appView.
    // Astrocentric coordinates are stored in events.position.
    onMouseDown: function(event) {
        if (!app.get('interactive'))
            return;
        
        var p = project.hitTest(event.point);
        if (p != null && (p.item == this.star || p.item == this.star.halo) && app.get('state') == PAUSED) {
            app.set('state', RUNNING);
            return;
        } else if (p != null && p.item != this.star.halo)
            return;
        event.position = [event.point.x - this.star.position.x, event.point.y - this.star.position.y];
        event.position[0] /= PIXELS_PER_AU;
        event.position[1] /= PIXELS_PER_AU;
        app.mainView.canvasMouseDown(event);
    },

    onMouseMove: function(event) {
        if (!app.get('interactive'))
            return;
        if (!app.get('state') == PAUSED)
            return;
        this.restoreSizes();
    },
    
    toggleState: function(event) {
        if (app.get('state') != PAUSED) {
            this.destroyHandles();
        }
        this.bobStar();
        
    },
    
    initialize: function() {
        var self = this;
        this.recalculateSizes();
        this.createBackgroundStars();
        
        var star = new Path.Circle({
            center: view.center,
            radius:STAR_SIZE 
        });

        star.fillColor = {
            gradient: {
                stops:[[COLOR_SUN_INNER, 0.075],[COLOR_SUN_OUTER, 0.85],[COLOR_SUN_OUTER2, 0.85], [COLOR_SUN_OUTER3, 1]],
                radial:true
            },
            origin: star.position,
            destination: star.bounds.rightCenter
        };

        star.halo = new Path.Circle({
            center:view.center,
            radius:STAR_HALO_SIZE 
        });

        star.halo.fillColor = {
            gradient: {
                stops:[[COLOR_SUN_HALO_INNER, 0], [COLOR_SUN_HALO_OUTER, 1]],
                radial:true
            },
            origin: star.position,
            destination: star.halo.bounds.rightCenter
        };
        star.halo.insertBelow(star);
        
        this.star = star;
        this.planets = [];
        this.handles = [];
        this.trailSegments = [];
        this.trailCoordinates = [];
        
        this.animations = [];
        
        this.animateStar();

        this.listenTo(this.model, "change:state", this.toggleState);
        this.listenTo(this.model, "change:nplanets change:position change:velocity change:state", function() {
            self.validatePlanet();
            self.planetsUpdate();
            self.handlesUpdate();
            self.trailsUpdate();
        });

        this.listenTo(this.model, "change:currentMission", this.animateTravel);
        //        this.listenTo(this.model, "change:state change:elements", this.trailsUpdate);
        this.listenTo(this.model, "collision", this.animateCollision);
        this.listenTo(this.model, "change:physicalSizes", function() {
            this.recalculateSizes();
            var star = this.star;
            star.bounds.width = 2*STAR_SIZE;
            star.bounds.height = 2*STAR_SIZE;
            star.halo.bounds.width = 2*STAR_HALO_SIZE;
            star.halo.bounds.height = 2*STAR_HALO_SIZE;
            
            star.position = view.center;
            star.halo.position = view.center;
            this.restoreSizes();
        });
    }
});

draw = new Draw({model: app});


function onResize(event) {
    draw.resize();
};

function onFrame(event) {
    
    if (app.get('state') != PAUSED) {
        app.tick();
    }

    draw.update();
}

onMouseDown = _.bind(draw.onMouseDown, draw);
onMouseMove = _.bind(draw.onMouseMove, draw);

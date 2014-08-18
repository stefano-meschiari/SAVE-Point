

// Number of pixels corresponding to 1 length unit (1 AU)
PIXELS_PER_AU = 200;
// Number of pixels corresponding to 1 speed unit (1 AU/day)
PIXELS_PER_AUPDAY = 100 / Math.sqrt(K2);
// Size of arrow
ARROW_SIZE = 10;
// Size of central star
STAR_SIZE = 40;
// Star halo size
STAR_HALO_SIZE = 150;
// Size of planets
PLANET_SIZE = 10;
PLANET_HALO_SIZE = 1.5*PLANET_SIZE;
// Segment length
SEGMENTS_LENGTH = 200;

// Number of stars
STARS = 0;

var Draw = Backbone.View.extend({
    backgroundStars:[],

    createBackgroundStars: function() {
        var c = 'rgba(255, 255, 255, 0.8)';
        var path = new Path.Circle(new Point(x, y), 3);
        path.fillColor = {
                gradient: {
                    stops:[c, 'black'],
                    radial:true
                },
                origin: path.position,
                destination: path.bounds.rightCenter
        };

        var symbol = new Symbol(path);
        
        for (var i = 0; i < STARS; i++) {
            var x = view.bounds.width*Math.random();
            var y = view.bounds.height*Math.random();
            symbol.place(new Point(x, y));
        }
        
    },
    
    createArrow: function(from, to) {
        var myPath = new Path.Line(from, to);
        var t = Math.atan2(to.y-from.y, to.x-from.x) * 180/Math.PI;
        var head = new Path.RegularPolygon(to, 3, ARROW_SIZE);
        
        head.fillColor = COLOR_OUTLINE;
        myPath.strokeColor = COLOR_OUTLINE;
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
            }
            head.position = to;
            g.last = t;
        };
        return g;
    },
    
    starUpdate: function(position) {
        this.star.halo.position.x = this.star.position.x = view.center.x + position[X] * PIXELS_PER_AU;
        this.star.halo.position.y = this.star.position.y = view.center.y + position[Y] * PIXELS_PER_AU;
    },
    
    planetsUpdate: function() {
        var self = this;
        
        var position = app.get('position');
        var planets = this.planets;
        var nplanets = app.get('nplanets');
        if (nplanets == 0)
            return;
        
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
                            stops:[[PLANET_COLORS[i],0.], ['black', 1]],
                            radial:true
                        },
                        origin: body.position,
                        destination: body.bounds.rightCenter
                    };
                    this.planets.push(body);
                    
                    body.planetIndex = i;

                    var dragFunction = function(event) {
                        c = [event.point.x - self.star.position.x, event.point.y - self.star.position.y, 0];
                        c[0] /= PIXELS_PER_AU;
                        c[1] /= PIXELS_PER_AU;
                        app.setPositionForBody(body.planetIndex, c);
                    };
                    
                    body.dragFunction = dragFunction;
                    body.on("mousedrag", body.dragFunction);
                    body.on("mousedown", function() {
                        var center = body.bounds.center;
                        body.bounds.size = new Size(4*PLANET_SIZE, 4*PLANET_SIZE);
                        body.bounds.center = center;
                        self.handles[body.planetIndex].halo.bounds.size = new Size(4*PLANET_HALO_SIZE, 4*PLANET_HALO_SIZE);
                        self.handles[body.planetIndex].halo.bounds.center = center;
                    });
                    body.on("mouseup", function() {
                        var center = body.bounds.center;                        
                        body.bounds.size = new Size(2*PLANET_SIZE, 2*PLANET_SIZE);
                        body.bounds.center = center;
                        self.handles[body.planetIndex].halo.bounds.size = new Size(2*PLANET_HALO_SIZE, 2*PLANET_HALO_SIZE);
                        self.handles[body.planetIndex].halo.bounds.center = center;
                    });

                    body.trail = new Path();
                    body.trail.insertBelow(body);
                    body.trail.strokeColor = PLANET_COLORS[i];
                    body.trailCounter = 0;
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
            planet.fillColor.origin = new Point(planet.position.x - w*Math.cos(angle),
                                                planet.position.y - w*Math.sin(angle));
            planet.fillColor.destination = new Point(planet.position.x + w*Math.cos(angle),
                                                     planet.position.y + w*Math.sin(angle));

            if (app.get('state') == RUNNING) {
                planet.trailCounter++;
                planet.trail.add(planet.position);
                
                if (planet.trail.segments.length > SEGMENTS_LENGTH) {
                    planet.trail.removeSegment(0);                
                }
            } else {
                if (planet.trail.segments.length > 0)
                    planet.trail.removeSegments();
            }
        }
    },

    handlesUpdate: function() {
        if (app.get('state') == RUNNING) {
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
        
        if (handles.length == 0 || handles.length != nplanets) {
            this.destroyHandles();

            for (i = 0; i < nplanets; i++) {
                var body = this.planets[i];
                var halo = new Path.Circle({
                    center: body.position,
                    radius: PLANET_HALO_SIZE
                });
                halo.fillColor = COLOR_OUTLINE;
                halo.on("mousedrag", body.dragFunction);
                halo.insertBelow(body);

                var dv = new Point(velocity[NPHYS*(i+1)+X], velocity[NPHYS*(i+1)+Y]);
                
                var vector = this.createArrow(body.position, body.position + dv * PIXELS_PER_AUPDAY);
                vector.insertBelow(body);


                var dragFunction = function(event) {
                    c = [event.point.x - body.position.x, event.point.y - body.position.y, 0];
                    c[0] /= PIXELS_PER_AUPDAY;
                    c[1] /= PIXELS_PER_AUPDAY;
                    app.setVelocityForBody(body.planetIndex, c);
                };
                vector.on("mousedrag", dragFunction);
                vector.on("mousedown", function(event) {
                    var center = vector.head.bounds.center;
                    vector.head.bounds.size = new Size(4*ARROW_SIZE, 4*ARROW_SIZE);
                    vector.head.bounds.center = center;
                });
                vector.on("mouseup", function(event) {
                    var center = vector.head.bounds.center;
                    vector.head.bounds.size = new Size(2*ARROW_SIZE, 2*ARROW_SIZE);
                    vector.head.bounds.center = center;
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

    animationsTick: function() {
        for (var i = this.animations.length-1; i >= 0; i--) {
            if (!this.animations[i]())
                this.animations.splice(i, 1);
        }
    },

    animateStar: function() {
        var start = 0;
        var N = 100;
        var dx = (2*STAR_SIZE-start)/N;
        var i = 1;
        var star = this.star;
        this.animations.push(function() {
            if (i == N)
                return false;
            star.bounds.width = i*dx;
            star.bounds.height = i*dx;
            star.halo.bounds.width = i*dx * STAR_HALO_SIZE/STAR_SIZE;
            star.halo.bounds.height = i*dx * STAR_HALO_SIZE/STAR_SIZE;
            
            star.position = view.center;
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

            star.bounds.width = STAR_SIZE * (2 + 0.2 * Math.sin(Math.PI*i/fr));
            star.bounds.height = STAR_SIZE * (2 + 0.2 * Math.sin(Math.PI*i/fr));
            star.position = view.center;
            i++;
            return true;
        });
    },
    
    update: function() {
        this.animationsTick();
        var position = app.get('position');
        this.starUpdate(position);
    },

    resize: function() {
        this.update();
        for (var i = 0; i < this.planets.length; i++) {
            this.planets[i].trail.removeSegments();
        }

        this.planetsUpdate();
        this.handlesUpdate();

    },
    
    // Mouse-down event on canvas. Forward message to appView.
    // Astrocentric coordinates are stored in events.position.
    onMouseDown: function(event) {
        var p = project.hitTest(event.point);
        if (p != null && p.item == this.star) {
            app.toggleState();
            return;
        } else if (p != null && p.item != this.star.halo)
            return;
        event.position = [event.point.x - this.star.position.x, event.point.y - this.star.position.y];
        event.position[0] /= PIXELS_PER_AU;
        event.position[1] /= PIXELS_PER_AU;
        appView.canvasMouseDown(event);
    },

    toggleState: function(event) {
        if (app.get('state') == RUNNING) {
            this.destroyHandles();
        }
        this.bobStar();
        
    },
    
    initialize: function() {
        var self = this;
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
        this.animations = [];

        this.animateStar();

        this.listenTo(this.model, "change:state", this.toggleState);
        this.listenTo(this.model, "change:nplanets change:position change:velocity change:state", function() {
            self.planetsUpdate();
            self.handlesUpdate();
        });
    }
});

draw = new Draw({model: app});


function onResize(event) {
    draw.resize();
};

function onFrame(event) {
    
    if (app.get('state') == RUNNING) {
        app.tick();
    }

    draw.update();
}

onMouseDown = _.bind(draw.onMouseDown, draw);

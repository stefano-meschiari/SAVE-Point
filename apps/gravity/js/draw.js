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
    
    starUpdate: function(coords) {
        this.star.halo.position.x = this.star.position.x = view.center.x + coords[X] * PIXELS_PER_AU;
        this.star.halo.position.y = this.star.position.y = view.center.y + coords[Y] * PIXELS_PER_AU;
    },
    
    planetsUpdate: function() {
        var that = this;
        
        var coords = app.coords();
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
                        c = [event.point.x - that.star.position.x, event.point.y - that.star.position.y, 0];
                        c[0] /= PIXELS_PER_AU;
                        c[1] /= PIXELS_PER_AU;
                        app.setCoords(body.planetIndex, c);
                    };
                    body.dragFunction = dragFunction;
                    body.on("mousedrag", body.dragFunction);
                    body.on("mousedown", function() {
                        var center = body.bounds.center;
                        body.bounds.size = new Size(4*PLANET_SIZE, 4*PLANET_SIZE);
                        body.bounds.center = center;
                    });
                    body.on("mouseup", function() {
                        var center = body.bounds.center;                        
                        body.bounds.size = new Size(2*PLANET_SIZE, 2*PLANET_SIZE);
                        body.bounds.center = center;                        
                    });
 
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

            planet.position.x = view.center.x + coords[NPHYS*(i+1)+X] * PIXELS_PER_AU;
            planet.position.y = view.center.y + coords[NPHYS*(i+1)+Y] * PIXELS_PER_AU;
            var dx = planet.position.x - star.position.x;
            var dy = planet.position.y - star.position.y;

            var angle = Math.atan2(dy, dx);
            var w = planet.bounds.width;
            planet.fillColor.origin = new Point(planet.position.x - w*Math.cos(angle),
                                                planet.position.y - w*Math.sin(angle));
            planet.fillColor.destination = new Point(planet.position.x + w*Math.cos(angle),
                                                     planet.position.y + w*Math.sin(angle));
            
        }
    },

    handlesUpdate: function() {
        if (app.get('state') == RUNNING) {
            if (this.handles.length != 0)
                this.destroyHandles();
            return;
        }

        var coords = app.coords();
        var vels = app.vels();
        var nplanets = app.get('nplanets');
        var handles = this.handles;
        var that = this;
        var i = 0;
        
        if (handles.length == 0 || handles.length != nplanets) {
            this.destroyHandles();

            for (i = 0; i < nplanets; i++) {
                var body = this.planets[i];
                var halo = new Path.Circle({
                    center: body.position,
                    radius: 1.5 * PLANET_SIZE
                });
                halo.fillColor = COLOR_OUTLINE;
                halo.on("mousedrag", body.dragFunction);
                halo.insertBelow(body);

                var dv = new Point(vels[NPHYS*(i+1)+X], vels[NPHYS*(i+1)+Y]);
                
                var velocity = this.createArrow(body.position, body.position + dv * PIXELS_PER_AUPDAY);
                velocity.insertBelow(body);


                var dragFunction = function(event) {
                    c = [event.point.x - body.position.x, event.point.y - body.position.y, 0];
                    c[0] /= PIXELS_PER_AUPDAY;
                    c[1] /= PIXELS_PER_AUPDAY;
                    app.setVels(body.planetIndex, c);
                };

                velocity.on("mousedrag", dragFunction);
                handles.push({halo:halo, vector:velocity});
            }
        }

        for (i = 0; i < nplanets; i++) {

            var vx = vels[NPHYS*(i+1)+X] * PIXELS_PER_AUPDAY;
            var vy = vels[NPHYS*(i+1)+Y] * PIXELS_PER_AUPDAY;

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
        var coords = app.coords();
        this.starUpdate(coords);
    },
    
    // Mouse-down event on canvas. Forward message to appView.
    // Astrocentric coordinates are stored in events.coords.
    onMouseDown: function(event) {
        var p = project.hitTest(event.point);
        if (p != null && p.item == this.star) {
            app.toggleState();
            return;
        } else if (p != null && p.item != this.star.halo)
            return;
        event.coords = [event.point.x - this.star.position.x, event.point.y - this.star.position.y];
        event.coords[0] /= PIXELS_PER_AU;
        event.coords[1] /= PIXELS_PER_AU;
        appView.canvasMouseDown(event);
    },

    toggleState: function(event) {
        if (app.get('state') == RUNNING) {
            this.destroyHandles();
        }
        this.bobStar();
        
    },
    
    initialize: function() {
        var that = this;
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
        this.listenTo(this.model, "change:nplanets change:coords change:vels change:state", function() {
            that.planetsUpdate();
            that.handlesUpdate();
        });
    }
});

draw = new Draw({model: app});


function onResize(event) {
    draw.update();
};

function onFrame(event) {
    
    if (app.get('state') == RUNNING) {
        app.tick();
    }

    draw.update();
}

onMouseDown = _.bind(draw.onMouseDown, draw);

// Number of pixels corresponding to 1 length unit (1 AU)
PIXELS_PER_AU = 100;
// Number of pixels corresponding to 1 speed unit (1 AU/day)
PIXELS_PER_AUPDAY = 100;
// Size of arrow
ARROW_SIZE = 10;
// Size of central star
STAR_SIZE = 200;

var Draw = Backbone.View.extend({
    backgroundStars:[],

    createBackgroundStars: function() {
        for (var i = 0; i < 50; i++) {
            var x = view.bounds.width*Math.random();
            var y = view.bounds.height*Math.random();
            var z = Math.random();
            var d = 1-z*z;
            var c = 'rgba(255, 255, 255, ' + d + ')';
            var path = new Path.Circle(new Point(x, y), 3);
            path.fillColor = {
                gradient: {
                    stops:[c, 'black'],
                    radial:true
                },
                origin: path.position,
                destination: path.bounds.rightCenter
            };
        }
        
    },
    
    createArrow: function(from, to) {
        var myPath = new Path();
        myPath.add(from);
        myPath.add(to);
        var t = Math.atan2(to.y-from.y, to.x-from.x);
        var head = new Path.RegularPolygon(to, 3, ARROW_SIZE);
        head.rotate(t - 30);
        head.fillColor = COLOR_OUTLINE;
        myPath.strokeColor = COLOR_OUTLINE;
        myPath.strokeWidth = 3;
        return new Group([myPath, head]);
    },
    
    starUpdate: function(coords) {
        this.star.position.x = view.center.x + coords[X] * PIXELS_PER_AU;
        this.star.position.y = view.center.y + coords[Y] * PIXELS_PER_AU;
    },
    
    planetsUpdate: function(coords) {
        var that = this;
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
                        radius:10
                    });
                    body.fillColor = {
                        gradient: {
                            stops:[PLANET_COLORS[i], 'black'],
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
                        app.setPlanetCoords(body.planetIndex, c);                        
                    };
                    body.dragFunction = dragFunction;
                    body.on("mousedrag", body.dragFunction);

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
            planet.fillColor.origin = new Point(planet.position.x - 10*Math.cos(angle),
                                                planet.position.y - 10*Math.sin(angle));
            planet.fillColor.destination = new Point(planet.position.x + 10*Math.cos(angle),
                                                     planet.position.y + 10*Math.sin(angle));
            
        }
    },

    handlesUpdate: function(coords, vels) {
        var nplanets = app.get('nplanets');
        var handles = this.handles;
        var i = 0;
        
        if (handles.length == 0 || handles.length != nplanets) {
            this.destroyHandles();

            for (i = 0; i < nplanets; i++) {
                var body = this.planets[i];
                var halo = new Path.Circle({
                    center: body.position,
                    radius: 15
                });
                halo.fillColor = COLOR_OUTLINE;
                halo.on("mousedrag", body.dragFunction);

                var dv = new Point(vels[NPHYS*(i+1)+X], vels[NPHYS*(i+1)+Y]);
                
                var velocity = this.createArrow(body.position, body.position + dv * PIXELS_PER_AUPDAY);
                var handle = new Group([halo, velocity]);
                handle.applyMatrix = false;
                handle.pivot = halo.bounds.center;
                handle.insertBelow(body);
                handles.push(handle);
            }
        }

        for (i = 0; i < nplanets; i++)
            handles[i].position = this.planets[i].position;

    },

    destroyHandles: function() {
        var handles = this.handles;
        for (var i = 0; i < handles.length; i++) 
            handles[i].remove();
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
            star.position = view.center;
            i++;
            return true;
        });
    },
    
    update: function() {
        this.animationsTick();
        var coords = app.coords();
        this.starUpdate(coords);
        this.planetsUpdate(coords);

        if (app.get('state') == PAUSED)
            this.handlesUpdate(coords, app.vels());
    },
    
    // Mouse-down event on canvas. Forward message to appView.
    // Astrocentric coordinates are stored in events.coords.
    onMouseDown: function(event) {
        
        var p = project.hitTest(event.point);
        if (p != null && p.item != this.star)
            return;
        
        event.coords = [event.point.x - this.star.position.x, event.point.y - this.star.position.y];
        event.coords[0] /= PIXELS_PER_AU;
        event.coords[1] /= PIXELS_PER_AU;
        appView.canvasMouseDown(event);
    },

    toggleState: function(event) {
        
    },
    
    initialize: function() {
        this.createBackgroundStars();
        
        var star = new Path.Circle({
            center: view.center,
            radius:STAR_SIZE
        });

        star.fillColor = {
            gradient: {
                stops:[[COLOR_SUN_INNER, 0.075],[COLOR_SUN_OUTER, 0.15],[COLOR_SUN_OUTER2, 0.15], [COLOR_SUN_HALO_INNER, 0.18], [COLOR_SUN_HALO_OUTER, 1]],
                radial:true
            },
            origin: star.position,
            destination: star.bounds.rightCenter
        };

        
        this.star = star;
        this.planets = [];
        this.handles = [];
        this.animations = [];

        this.animateStar();

        this.listenTo(this.model, "change:state", this.toggleState);
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

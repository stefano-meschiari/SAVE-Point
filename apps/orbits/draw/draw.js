// Number of stars
STARS = 300;
CANVAS_ID = 'canvas';
MAX_SEGMENTS = 400;
SLOW_ENV = false;
DEFAULT_SPEED = 1;
SPEED = DEFAULT_SPEED;

CLUSTERS = 20;
CLUSTER_SIZE = window.innerWidth / 10;
CLUSTER_COMP = 4;

// Number of pixels corresponding to 1 length unit (1 AU)
PIXELS_PER_AU = PIXELS_PER_AU_1 = 200;
// Number of pixels corresponding to 1 speed unit (1 AU/day)
PIXELS_PER_AUPDAY = PIXELS_PER_AUPDAY_1 = 100 / Math.sqrt(K2);
// Number of pixels corresponding to 1 force unit
PIXELS_PER_FORCE = 200000;
// Minimum size of drag target
DRAG_TARGET_MIN_SIZE = 40;
// Width of stem of arrow
ARROW_STEM_SIZE = 10;
// With of stem of force arrow
FORCE_ARROW_STEM_SIZE = 3;
FORCE_ARROW_SIZE = 6;
// Force power index
FORCE_POWER_INDEX = 2;
// Force color (move to configuration file)
FORCE_COLOR = 'rgba(214, 197, 0, 1)';
// Minimum body sizes
MIN_BODY_SIZE = 10;
MIN_BODY_SIZE_PHYSICAL = 2;

function ThreeDPath(coords, strokeWidth, color, body, star, transformation) {
    this.p = [];
    this.m = [];
    this.strokeWidth = strokeWidth;
    this.color = color;
    this.body = body;
    this.coords = coords;
    this.transformation = transformation;
    this.update();
}


ThreeDPath.prototype.remove = function() {
    for (var i = 0; i < this.p.length; i++)
        this.p[i].remove();
    for (i = 0; i < this.m.length; i++)
        this.m[i].remove();
    this.p = [];
    this.m = [];
};

ThreeDPath.prototype.makePath = function() {
    var path = new Path();
    path.strokeWidth = this.strokeWidth;
    path.strokeColor = this.color;
    return path;
};

ThreeDPath.prototype.update = function() {
    this.remove();
    
    var prev_Z;
    var path;
    
    for (i = 0; i < this.coords.length; i++) {
        var c = Physics.applyRotation(this.transformation, this.coords[i], {});

        c.x += view.center.x;
        c.y += view.center.y;

        if (! path) {
            path = this.makePath();
            if (c.z > 0)
                this.p.push(path);
            else
                this.m.push(path);
        }
        
        if (c.z > 0) {
            if (prev_Z !== undefined && prev_Z < 0) {
                path.add(c);
                path = this.makePath();
                this.p.push(path);
            }
            path.add(c);
        } else {
            if (prev_Z !== undefined && prev_Z > 0) {
                path.add(c);
                path = this.makePath();
                this.m.push(path);
            }
            path.add(c);            
        }
        prev_Z = c.z;
    }

    this.sort();
};

ThreeDPath.prototype.sort = function() {
    for (var i = 0; i < this.p.length; i++) {
        this.p[i].bringToFront();
        if (this.body.positionZ > 0)
            this.body.bringToFront();
    }
    for (i = 0; i < this.m.length; i++)
        this.m[i].sendToBack();
};

var DrawUtils = {
    triangleCenter: function(path) {
        var x = path.segments[0].point.clone();
        for (var i = 1; i < 3; i++) 
            x += path.segments[i].point;

        x /= 3;
        return x;
    },
    
    createArrow: function(from, to, color, arrowSide, strokeSize, options) {
        color = color || COLOR_OUTLINE;
        arrowSide = arrowSide || ARROW_SIZE;
        strokeSize = strokeSize || ARROW_STEM_SIZE;
        var type = 'regular';
        options = options || {};
        
        
        var stem = new Path.Line(from, to);
        stem.strokeColor = {
            gradient: {
                stops:[[color, 0.5], ['rgba(0, 0, 0, 0)', 1]]
            },
            origin: to,
            destination: from
        };
        stem.strokeCap = 'square';
        stem.strokeWidth = strokeSize;

        // Triangle properties
        var arrowRadius = 3/Math.sqrt(3) * arrowSide;
        var arrowHeight = Math.sqrt(3)/2 * arrowSide;
        var shift = arrowHeight - arrowRadius;
        
        var t = Math.atan2(to.y-from.y, to.x-from.x);
        var pi_2 = Math.PI/2.;
        var tdeg = t * 180/Math.PI;
        
        var head2 = new Path.Circle({ center: to, radius: 2*arrowRadius });
        head2.fillColor = 'rgba(0, 0, 0, 0)';
        if (options.unclickable)
            head2.visible = false;
        
        var head;
        if (type == 'regular') {
            head = new Path.RegularPolygon(to, 3, arrowRadius);
            head.rotate(-30);
            
        } else {
            arrowSide *= 2;
            arrowHeight *= 3;
            head = new Path();
            var head_shift = strokeSize/2;
            var x1 = to.x + head_shift * Math.cos(t + pi_2);
            var y1 = to.y + head_shift * Math.sin(t + pi_2);

            var x2 = x1 + arrowHeight * Math.cos(t);
            var y2 = y1 + arrowHeight * Math.sin(t);

            var x3 = x1 + arrowSide * Math.cos(t - pi_2);
            var y3 = y1 + arrowSide * Math.sin(t - pi_2);

            head.add(new Point(x1, y1));
            head.add(new Point(x2, y2));
            head.add(new Point(x3, y3));
            head.add(new Point(x1, y1));
            
        }

        head.fillColor = color;        

        head.rotate(tdeg);
        head.position = to;
        var center = DrawUtils.triangleCenter(head);
        head.position -= center - to;       
        head.position.x -= shift * Math.cos(t);
        head.position.y -= shift * Math.sin(t);

        head2.position = head.position;
        stem.locked = true;
        if (options.unclickable) {
            head.locked = true;
            head2.locked = true;
        }
        
        var g = {};
        g.last = tdeg;

        g.on = function(what, f) {
            head.on(what, f);
            head2.on(what, f);
        };

        g.head = head;
        
        g.setVector = function(from, to) {
            stem.segments[0].point = from;
            stem.segments[1].point = to;
            stem.strokeColor.origin = to;
            stem.strokeColor.destination = from;
            
            var t = Math.atan2(to.y-from.y, to.x-from.x);
            var tdeg = t * 180/Math.PI;
            
            if (tdeg != g.last) {
                head.rotate(-g.last);
                head.rotate(tdeg);
            } 

            head.position = to;
            var center = DrawUtils.triangleCenter(head);
            head.position -= center - to;
            head.position.x -= shift * Math.cos(t);
            head.position.y -= shift * Math.sin(t);
            head2.position = to;
            g.last = tdeg;   
        };

        g.remove = function() {
            stem.remove();
            head.remove();
            head2.remove();
            g.frame = null;
        };

        var direction = 1;
        g.frame = function() {
            if (SLOW_ENV)
                return;
            
            var f = stem.strokeColor.gradient.stops[0].rampPoint;
            f -= direction * 0.0075;
            if (f <= 0.1 || f >= 0.5) {
                direction *= -1;
            }
            stem.strokeColor.gradient.stops[0].rampPoint = f;
            if (g.frame)
                requestAnimationFrame(g.frame);
        };

        g.insertBelow = function(body) {
            head.insertBelow(body);
            head2.insertBelow(body);
            stem.insertBelow(head);
        };

        g.insertAbove = function(body) {
            head.insertAbove(body);
            head2.insertAbove(body);
            stem.insertAbove(head);
        };

        g.sendToBack = function(body) {
            head.sendToBack();
            head2.sendToBack();
            stem.sendToBack();
        };

        

        g.show = function() {
            head.visible = true;
            if (!options.unclickable)
                head2.visible = true;
            stem.visible = true;
        };

        g.hide = function() {
            head.visible = false;
            head2.visible = false;
            stem.visible = false;
        };

        g.intersects = function(obj) {
            return head.intersects(obj) || stem.intersects(obj);
        };

        g.bounds = function() {
            return head.bounds.unite(stem.bounds);
        };

        if (!options.static)
            requestAnimationFrame(g.frame);
        
        return g;
    }    
};



var Draw = Backbone.View.extend({
    backgroundStars:[],
    backgroundStarsCoords:[],
    
    animating:false,
    zoom:1,
    autoZoom: true,
    
    color: function(type, index) {
        var colors = app.mission().get('colors') || [];
        if (_.isString(colors)) {
            colors = [colors];
            app.mission().set('colors', colors);
        }
        var color = Colors.cyan;
        if (colors[index] && Colors[colors[index]])
            color = Colors[colors[index]];

        if (type == TYPE_HALO)
            color = window.Color(color).lighten(0.2).rgbString();
        else if (type == TYPE_OUTLINE)
            color = window.Color(color).clearer(0.5).rgbString();
        
        return color;
    },
    
    setZoom: function(zoom, disableAutoZoom) {
        if (zoom < 0.05 || zoom > 10)
            return;
        
        if (disableAutoZoom !== undefined)
            this.autoZoom = !disableAutoZoom;
        
        zoom = ((zoom * 100)|0)/100;

        $("#zoom-value").text((zoom * 100)|0);
        this.zoom = zoom;
        PIXELS_PER_AU = PIXELS_PER_AU_1 * zoom;
        PIXELS_PER_AUPDAY = PIXELS_PER_AUPDAY_1 * zoom;
        
        if (this.transformation)
            this.transformation.stretch = PIXELS_PER_AU;
        
        for (var i = 0; i < this.planets.length; i++) {
            if (this.computedTrailPaths && this.computedTrailPaths[i])
                this.computedTrailPaths[i].update();
            if (this.trailPaths && this.trailPaths[i]) {
                this.trailPaths[i].update();
            }
        }
        
        this.recalculateSizes();
        this.planetsUpdate();
        this.handlesUpdate();
        this.resetObjects();
        this.trailsUpdate();        
    },

    setSpeed: function(speed) {
        if (speed > 16 || speed < 1/16)
            return;

        var speedLabel = speed;
        if (speed < 1)
            speedLabel = "1/" + (1./speed).toFixed(0);
        
        $("#speed-value").text(speedLabel);
        SPEED = speed;
    },
    
    calculateBodySize: function(mass, body) {
        mass = mass * Units.MSUN / Units.MEARTH;
        var radius;

        if (mass < Units.MJUP / Units.MEARTH) {
            radius = Math.pow(mass, 0.42);
        } else {
            radius = _m.interp(mass, Units.MJUP/Units.MEARTH, Units.MSUN/Units.MEARTH, Units.RJUP/Units.REARTH, Units.RSUN/Units.REARTH);
        }

        var physicalSizes = app.get('physicalSizes');
        if (! physicalSizes) {
            R = MIN_BODY_SIZE * (radius < 11 ? Math.pow(radius, 0.4) : Math.pow(radius, 0.4))|0;            
        } else {
            R = Math.max((radius * Units.REARTH / Units.AU) | 0, MIN_BODY_SIZE_PHYSICAL);
        }

        if (body) {
            body.bodyRadius = R;
            body.haloRadius = Math.max(3 * R, DRAG_TARGET_MIN_SIZE);
            body.bodyDragRadius = 2 * R;
            if (body.radius > 0.5*DRAG_TARGET_MIN_SIZE)
                body.bodyDragRadius = 0.5 * DRAG_TARGET_MIN_SIZE;
            body.haloDragRadius = body.haloRadius;
        }
        return R;
    },
    
    recalculateSizes: function() {
        // Size of arrow
        var zoom = this.zoom;
        var star = this.star;
        if (!star)
            return;
        
        ARROW_SIZE = 0.3*DRAG_TARGET_MIN_SIZE;
        this.calculateBodySize(1, star);
        
        app.set('minAU', zoom * star.bodyRadius / PIXELS_PER_AU);
        

        if (star) {
            var center = star.bounds.center;
            star.bounds.width = 2*zoom*star.bodyRadius;
            star.bounds.height = 2*zoom*star.bodyRadius;
            star.halo.bounds.width = 2*zoom*star.haloRadius;
            star.halo.bounds.height = 2*zoom*star.haloRadius;
            
            star.position = center;
            star.halo.position = center;
        }
        if (this.planets)
            for (var i = 0; i < this.planets.length; i++) {
                var body = this.planets[i];
                this.calculateBodySize(app.massForBody(i), body);
                
                if (!body.dragging) {
                    center = body.bounds.center;                
                    body.bounds.size = new Size(2*body.bodyRadius*zoom, 2*body.bodyRadius*zoom);
                    body.bounds.center = center;
                }
                if (this.handles.length > i && !body.dragging) {
                    this.handles[body.planetIndex].halo.bounds.size = new Size(2* body.haloRadius, 2 * body.haloRadius);
                    this.handles[body.planetIndex].halo.bounds.center = center;
                }
                
            }
        
    },

    randomColor: function(rgb) {
        return "rgba(" + 
            ((rgb[0][0] + Math.random() * (rgb[1][0] - rgb[0][0]))|0) + "," +
            ((rgb[0][1] + Math.random() * (rgb[1][1] - rgb[0][1]))|0) + "," +
            ((rgb[0][2] + Math.random() * (rgb[1][2] - rgb[0][2]))|0) + ",";
    },
    
    createBackgroundStars: function() {
        var R = 0.75*Math.max(view.bounds.width, view.bounds.height);        
        var symbols = [];
        var i;
        
        for (i = 0; i < this.backgroundStars.length; i++)
            this.backgroundStars[i].remove();
        
        this.backgroundStars = [];
        
        for (i = 1; i <= 3; i++) {
            var path = new Path.Circle(new Point(0, 0), i);
            path.fillColor = 'rgba(255, 255, 255, 1)';
            symbols[i] = new Symbol(path);
        }

        
        
        for (i = 0; i < STARS - CLUSTERS * CLUSTER_COMP; i++) {
            var u = 1-2*Math.random();
            var t = Math.random() * 2 * Math.PI;
            
            var x = R*Math.sqrt(1-u*u) * Math.cos(t);
            var y = R*Math.sqrt(1-u*u) * Math.sin(t);
            var z = R*u;

            var size = (3*Math.random()+1)|0;

            var s = symbols[size].place(new Point(x, y) + view.center);
            
            s.coords = {x: x, y: y, z: z, f: 1 };
            if (z < 0)
                s.visible = false;
            this.backgroundStars.push(s);
        }

        var COLOR_RANGES = [
            [ [ 191, 137, 197 ], [184, 131, 105] ],
            [ [ 66, 132, 191 ], [57, 140, 136] ],
            [ [174, 72, 87], [169, 128, 130] ],
            [ [169, 180, 143], [66, 144, 102]]
        ];

        symbols = [];
        for (i = 0; i < CLUSTER_COMP; i++) {
            var cr = ((0.2 + 0.8 * Math.random()) * CLUSTER_SIZE)|0; 
            
            var blob = new Path.Circle(new Point(0, 0), cr);
            var crange = _.sample(COLOR_RANGES, 1)[0];
            var c = this.randomColor(crange);
            blob.fillColor = {
                gradient: {
                    stops:[[c + "0.3)", 0.], [c + "0)", 1]],
                    radial:true
                },
                origin: blob.position,
                destination: blob.bounds.rightCenter
            };
            blob.locked = true;

            symbols[i] = new Symbol(blob);
        }

        for (i = 0; i < CLUSTERS; i++) {
            u = 1-2*Math.random();
            t = Math.random() * 2 * Math.PI;
            var fac = (i == 0 ? 0.1 : 1);
            
            x = R*Math.sqrt(1-u*u) * Math.cos(t);
            y = R*Math.sqrt(1-u*u) * Math.sin(t);
            z = R*u;
            var s = Math.random() + 0.1;
            for (var j = 0; j < CLUSTER_COMP; j++) {
                var t2 = Math.random() * 2 * Math.PI;
                var r2 = Math.pow(Math.random(), 0.2) * CLUSTER_SIZE;
                var x2 = x + r2 * Math.cos(t2) * s * s;
                var y2 = y + r2 * Math.sin(t2) * (1-s * s);
                var z2 = z + r2 * Math.random();

                var idx = (symbols.length*Math.random())|0;
                blob = symbols[idx].place(new Point(x2, y2) + view.center);
                if (z < 0)
                    blob.visible = false;
                blob.coords = {x: x2, y: y2, z: z2, f: 1 };
                blob.sendToBack();
                this.backgroundStars.push(blob);
            }
            
        }
        
        
    },

    rotateBackgroundStars:function(fix) {
        var bg = this.backgroundStars;
        var ret = {};
        
        var cx = view.center.x;
        var cy = view.center.y;
        var w = view.bounds.width;
        var h = view.bounds.height;
        
        this.transformation.stretch = 1;
        for (var i = 0; i < bg.length; i++) {
            var s = bg[i];
            if (fix)
                ret = s.coords;
            Physics.applyRotation(this.transformation, s.coords, ret);
            
            s.visible = ret.z > 0 && ret.x + cx > 0 && ret.y + cy > 0
                && ret.x + cx < w && ret.y + cy < h;
            if (!s.visible)
                continue;
            
            s.position.x = ret.x + cx;
            s.position.y = ret.y + cy;
        }

        this.transformation.stretch = PIXELS_PER_AU;
    },

    displayMessage: function(text, options) {
        options = options || {};
        options.color = options.color || COLOR_MESSAGE;
        options.font = options.font || FONT_MESSAGE;
        options.y = options.y || 100;

        var textItem = new PointText(new Point(view.center.x, options.y));

        textItem.fillColor = options.color;
        textItem.fontFamily = options.font.fontFamily;
        textItem.fontSize = options.font.fontSize;
        textItem.fontWeight = options.font.fontWeight;
        textItem.justification = 'center';
        textItem.content = text;
    },

    text: null,
    directions: [[1, 0], [0, -1], [-1, 0], [0, 1]],
    
    showText: function(label, position, color, distance, intersectingObjects) {
        this.hideText();
        if (!distance)
            distance = 0;
        
        var text = new PointText({
            point: position + new Point(0, distance),
            content: label,
            fillColor: color,
            fontSize: 20,
            justification: 'center'
        });

        if (intersectingObjects) {
            var positions = [];
            var intersections = _.map(this.directions, function(dir) {
                text.position = position + new Point(dir[0] * (distance + 0.5 * text.bounds.width) , dir[1] * (distance + 0.5 * text.bounds.height));
                
                positions.push(text.position);
                
                return _.countWhere(intersectingObjects, function(obj) {
                    if (!obj)
                        return false;
                    if (_.isFunction(obj.bounds)) {
                        return obj.bounds().intersects(text.bounds);
                    } else
                        return obj.bounds.intersects(text.bounds);
                });
            });

            var which = _m.whichMin(intersections);
            text.position = positions[which];
        }

        var textPane = new Path.Rectangle(text.bounds, 10);
        textPane.fillColor = Colors.glass;
        textPane.position -= new Point(10, 10);
        textPane.bounds.width += 20;
        textPane.bounds.height += 20;
        
        textPane.insertBelow(text);

        this.text = text;
        this.textPane = textPane;
        return this.text;
    },

    hideText: function() {
        if (this.text) {
            this.text.remove();
            this.text = null;
            this.textPane.remove();
            this.textPane = null;
        }
    },

    showTip: function(what, untilEvent) {
        
    },

    hideTip: function() {
        if (this.tip) {
            this.tip.remove();
            this.tip = null;
            this.tipPane.remove();
            this.tipPane = null;
        }
    },

    pushAnimation: function(name, fun) {
        var f = {f: _.bind(fun, this), name: name};
        this.animations.push(f);
    },

    cancelAnimation: function(name) {
        for (var i = 0; i < this.animations.length; i++) {
            if (this.animations[i].name == name) {
                this.animations[i].f('cancel');
                this.animations.splice(i, 1);
            }
        }
    },

    getAnimation: function(name) {
        for (var i = 0; i < this.animations.length; i++)
            if (this.animations[i].name == name)
                return this.animations[i];
        return null;
    },

    fly: function() {
        if (this.getAnimation('fly'))
            return;

        var self = this;
        var dI = 0.001 * SPEED;
        var interactivity = app.get('interactive');
        var scale = Math.pow(0.1, 4./20);
        
        this.cancelAnimation('cancel-fly');
        this.cancelAnimation('star');
        this.destroyTrails();
        this.destroyHandles();
        this.destroyPlanets();
        
        app.set('interactive', false);
        var size = self.star.bounds.width;
        
        this.pushAnimation('fly', function(arg) {
            Physics.setRotation(self.transformation,
                                self.transformation.I + dI,
                                self.transformation.O,
                                self.transformation.W + dI,
                                PIXELS_PER_AU);
            
            self.rotateBackgroundStars();
            if (self.star.visible && self.star.bounds.width >= 1) {
                size *= scale;
                if (size > 1) { 
                    self.star.bounds.width = size;
                    self.star.bounds.height = size;
                } else {
                    self.star.visible = false;
                    self.star.halo.visible = false;
                }
            } else {
                self.star.visible = false;
                self.star.halo.visible = false;
            }
            if (arg == 'cancel') {
                app.set('interactive', interactivity);
                
                return false;
            }
            return true;
        });
    },

    cancelFly: function() {
        if (!this.getAnimation('fly'))
            return;

        var self = this;
        var interactivity = app.get('interactive');
        this.cancelAnimation('fly');
        this.cancelAnimation('star');
        
        var dI_start = 0.001 * SPEED;
        var frames = 60;
        var frame = 0;
        
        this.pushAnimation('cancel-fly', function(arg) {
            app.set('interactive', false);
            var dI = dI_start * (1-frame/frames);

            Physics.setRotation(self.transformation,
                                self.transformation.I + dI,
                                self.transformation.O,
                                self.transformation.W + dI,
                                PIXELS_PER_AU);

            self.rotateBackgroundStars();
            frame++;
            
            if (arg == 'cancel' || frame == frames) {
                self.rotateBackgroundStars(true);
                self.resetTransformation();
                app.set('interactive', true);
                app.trigger('cancelFly');
                if (frame == frames)
                    self.animateStar();
                return false;
            }
            return true;
        });
    },
    
    animateActionFeedback: function(pos, size) {
        size = size || 50;
        var circle = new Path.Circle(pos, 1);
        circle.fillColor = 'white';
        circle.opacity = 1;

        var frame = 0;
        var frames = 30;

        
        this.pushAnimation('feedback', function(arg) {
            circle.opacity = Math.pow((frames-frame)/frames, 1);
            var newSize = Math.floor(size*Math.pow((frame)/frames, 1)+1);

            circle.bounds.width = newSize;
            circle.bounds.height = newSize;
            circle.position = pos;
            
            frame++;
            if (frame > frames || arg == 'cancel') {
                circle.remove();
                return false;
            }
            else
                return true;
        });
    },

    
    animateCollision: function(info) {
        var self = this;
        this.planets[info.planet-1].visible = false;
        var smokeColor = this.color(TYPE_PLANET, info.planet-1);
        
        var frame = 0;
        var frames = 60;
        var explosionSize = 100;

        var x = info.pos[0] * PIXELS_PER_AU + this.star.position.x;
        var y = info.pos[1] * PIXELS_PER_AU + this.star.position.y;

        var pos = new Point(x, y);
        var smoke = new Path.Circle(pos, 1);
        smoke.fillColor = smokeColor;
        smoke.opacity = 1;

        this.bobStar();
        this.pushAnimation('smoke', function(arg) {

            smoke.opacity = Math.pow((frames-frame)/frames, 1);
            var size = Math.floor(explosionSize*Math.pow((frame)/frames, 1)+1);
            
            smoke.bounds.width = size;
            smoke.bounds.height = size;
            smoke.position = pos;
            
            frame++;
            if (frame > frames || arg == 'cancel') {
                smoke.remove();
                return false;
            }
            else
                return true;
        });

        UI.animate('#canvas');
    },
    
    animateTravel: function() {
        return;
        var self = this;
        this.animating = true;

        this.cancelAnimation('star');
        
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
        
        this.pushAnimation('travel', function(cmd) {
            if (cmd == 'cancel')
                frame = frames;
            
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


    forces: [],
    showForces: function(index) {
        if (app.flags.disabledForce) {
            this.hideForces();
            return;
        }
        
        var forces = this.forces;
        
        for (var i = 0; i < app.get('nplanets'); i++) {
            if (index && i != index)
                continue;
            var body = this.planets[i];
            
            if (app.typeForBody(body.planetIndex) == TYPE_PLANET_FIXED)
                continue;
            
            var f = app.forceForBody(body.planetIndex, FORCE_POWER_INDEX);
            var forceTo = body.position + new Point(f[X], f[Y]) * PIXELS_PER_FORCE;
            
            if (forces[i] == null)
                forces[i] = DrawUtils.createArrow(body.position, forceTo, FORCE_COLOR, FORCE_ARROW_SIZE,
                                                  FORCE_ARROW_STEM_SIZE, {static: true, unclickable: true});
            else
                forces[i].setVector(body.position, forceTo);
            
            if (this.planets[i]) {
                forces[i].sendToBack();
                forces[i].insertAbove(this.star);
                forces[i].show();
            }
        }
    },

    hideForces: function() {
        for (var i = 0; i < this.forces.length; i++)
            if (this.forces[i]) {
                this.forces[i].hide();
            }
    },
    
    starUpdate: function() {
        var position = app.povPositionForBody(-1);
        position = Physics.applyRotation(this.transformation,
                              { x: position[X], y: position[Y], z: position[Z] },
                              {} );

        this.star.halo.position.x = this.star.position.x = view.center.x + position.x;
        this.star.halo.position.y = this.star.position.y = view.center.y + position.y;

        this.bary.visible = (Math.abs(this.star.halo.position.x - view.center.x) + Math.abs(this.star.halo.position.y - view.center.y) > 4);
        this.bary.position = view.center;

    },

    validatePlanetPositions: function(position) {
        var planets = this.planets;
        var minDist = app.get('minAU') * PIXELS_PER_AU;
        
        for (var i = 0; i < planets.length; i++) {
            var blocked = true;
            var point = planets[i].position;
            var bsize = 40;
            var changed = false;
            var trials = 0;
            
            while (blocked) {
                blocked = false;
                var dist = Math.sqrt((point.x - view.center.x) * (point.x - view.center.x) +
                                     (point.y - view.center.y) * (point.y - view.center.y));

                
                if (dist < minDist) {
                    point.x = (point.x - view.center.x) * minDist/dist + view.center.x;
                    point.y = (point.y - view.center.y) * minDist/dist + view.center.y;
                    blocked = true;
                    changed = true;
                }
                
                if (point.x - bsize < 0 ||
                    point.y - bsize < 0 ||
                    point.x + bsize > view.bounds.width ||
                    point.y + bsize > view.bounds.height ||
                    document.elementFromPoint(point.x + bsize, point.y + bsize).id !== CANVAS_ID)
                {
                    var t = Math.random() * 2 * Math.PI;
                    var w = Math.random() * 50 + 200;
                    point.x = w * Math.cos(t) + this.star.position.x;
                    point.y = w * Math.sin(t) + this.star.position.y;
                    blocked = true;
                    changed = true;
                }
                trials++;
                if (trials > 5)
                    break;
            }

            if (changed) {
                var c = [(point.x - view.center.x)/PIXELS_PER_AU, (point.y - view.center.y) / PIXELS_PER_AU, 0];
                app.povSetPositionForBody(i, c);                
            }
        }
    },
    
    planetsUpdate: function() {
        if (!app.get('interactive'))
            return;
        
        var self = this;
        
        
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
                    var radius = this.calculateBodySize(app.massForBody(i));
                    var body = new Path.Circle({
                        center: view.center,
                        radius: radius 
                    });
                    this.calculateBodySize(app.massForBody(i), body);
                    
                    var bodyColor = this.color(TYPE_PLANET, i);
                    body.fillColor = {
                        gradient: {
                            stops:[[bodyColor, 0.], ['black', 0.85]],
                            radial:true
                        },
                        origin: body.position,
                        destination: body.bounds.rightCenter
                    };
                    this.planets.push(body);
                    
                    body.planetIndex = i;

                    
                    (function(body) {
                        var drag = function(event) {
                            if (app.flags.disabledPlanetDrag)
                                return;
                            if (app.typeForBody(body.planetIndex) == TYPE_PLANET_FIXED)
                                return;

                            var minDist = app.get('minAU') * PIXELS_PER_AU;
                            var point = event.point;
                            var bsize = body.bounds.width;
                            var refuseDrag = false;
                            
                            var dist = Math.sqrt((point.x - view.center.x) * (point.x - view.center.x) +
                                                 (point.y - view.center.y) * (point.y - view.center.y));

                            if (dist < minDist) {
                                point.x = (point.x - view.center.x) * minDist/dist + view.center.x;
                                point.y = (point.y - view.center.y) * minDist/dist + view.center.y;                            
                            }
                            
                            if (point.x - bsize < 0 ||
                                point.y - bsize < 0 ||
                                point.x + bsize > view.bounds.width ||
                                point.y + bsize > view.bounds.height ||
                                document.elementFromPoint(point.x-bsize, point.y-bsize).id !== CANVAS_ID ||
                                document.elementFromPoint(point.x+bsize, point.y+bsize).id !== CANVAS_ID ||
                                document.elementFromPoint(point.x, point.y).id !== CANVAS_ID)
                            {
                                refuseDrag = true;
                            }

                            if (!body.dragging)
                                body.mouseDown();
                            
                            body.dragging = true;

                            if (!refuseDrag) {
                                var c = [point.x - self.star.position.x, point.y - self.star.position.y, 0];
                                c[0] /= PIXELS_PER_AU;
                                c[1] /= PIXELS_PER_AU;
                                app.povSetPositionForBody(body.planetIndex, c);                            
                            }

                            var info = app.getHumanInfoForBody(body.planetIndex, { distanceOnly: true });

                            self.showText("Distance:\n" + info.distance, body.position,
                                          self.color(TYPE_HALO, body.planetIndex), body.bounds.height,
                                          [ self.handles[body.planetIndex].vector, self.forces[body.planetIndex], self.star ]);
                        };

                        var mouseDown = function() {
                            if (app.typeForBody(body.planetIndex) == TYPE_PLANET_FIXED)
                                return;
                            app.set('selectedPlanet', body.planetIndex + 1);
                            var center = body.bounds.center;
                            var R = draw.zoom*body.bodyDragRadius;
                            var hR = body.haloDragRadius;
                            body.bounds.size = new Size(2*R, 2*R);
                            body.bounds.center = center;
                            self.handles[body.planetIndex].halo.bounds.size = new Size(2*hR, 2*hR);
                            self.handles[body.planetIndex].halo.bounds.center = center;
                        };

                        var mouseUp = function() {
                            if (app.typeForBody(body.planetIndex) == TYPE_PLANET_FIXED)
                                return;
                            
                            if (app.flags.disabledPlanetDrag)
                                return;
                            
                            if (body.dragging)
                                app.trigger("planet:drag");
                            
                            body.dragging = false;

                            self.hideText();
                            self.recalculateSizes();
                        };
                        
                        body.drag = drag;
                        body.mouseDown = mouseDown;
                        body.mouseUp = mouseUp;
                        
                        body.on("mousedrag", body.drag);
                        body.on("mousedown", body.mouseDown);
                        body.on("mouseup", body.mouseUp);
                    })(body);
                }
                
            } else {
                for (i = nplanets; i < planets.length; i++) {
                    planets[i].visible = false;                    
                }
            }
        }

        var star = this.star;
        var ret = {};
        var zoomOut = false;
        var position = [];
        
        for (i = 0; i < nplanets; i++) {
            var planet = planets[i];
            position = app.povPositionForBody(i, position);
            
            Physics.applyRotation(this.transformation,
                                  { x: position[X], y: position[Y], z: position[Z] },
                                  ret);
            
            planet.position.x = ret.x + view.center.x;
            planet.position.y = ret.y + view.center.y;

            if (ret.z < 0)
                planet.insertBelow(this.star);
            else
                planet.bringToFront();

            planet.positionZ = ret.z;
            var dx = planet.position.x - star.position.x;
            var dy = planet.position.y - star.position.y;

            var angle = Math.atan2(dy, dx);
            var w = planet.bounds.width;
            
            planet.fillColor.origin = new Point(planet.position.x - 0.5*w*Math.cos(angle),
                                                planet.position.y - 0.5*w*Math.sin(angle));
            planet.fillColor.destination = new Point(planet.position.x + 0.5*w*Math.cos(angle),
                                                     planet.position.y + 0.5*w*Math.sin(angle));

            if (planet.position.x < 0 || planet.position.y < 0 || planet.position.x > view.bounds.width || planet.position.y > view.bounds.height)
                zoomOut = true;
        }

        if (zoomOut && (app.get('state') == RUNNING || app.get('state') == ROTATABLE) && this.autoZoom)
            this.setZoom(this.zoom * 0.5);        
    },

    handlesUpdate: function() {
        if (!app.get('interactive'))
            return;
        
        if (app.get('state') != PAUSED) {
            if (this.handles.length != 0)
                this.destroyHandles();
            return;
        }

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
                    radius: body.haloRadius
                });

                var haloColor = this.color(TYPE_HALO, i);
                
                halo.fillColor =  {
                    gradient: {
                        stops:[[haloColor, 0.3], [window.Color(haloColor).alpha(0).rgbString(), 0.8]],
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
                
                var vector = DrawUtils.createArrow(body.position, body.position + dv * PIXELS_PER_AUPDAY,
                                                   haloColor);

                (function(body, vector) {
                    vector.insertBelow(body);
                    
                    vector.on("mousedrag", function(event) {
                        if (app.flags.disabledVelocityDrag)
                            return;
                        if (app.typeForBody(body.planetIndex) == TYPE_PLANET_FIXED)
                            return;
                        
                        
                        vector.dragging = true;
                        c = [event.point.x - body.position.x, event.point.y - body.position.y, 0];
                        c[0] /= PIXELS_PER_AUPDAY;
                        c[1] /= PIXELS_PER_AUPDAY;
                        app.setVelocityForBody(body.planetIndex, c);

                        var info = app.getHumanInfoForBody(body.planetIndex);
                        self.showText("Speed:\n" + info.speed, vector.head.position,
                                      self.color(TYPE_HALO, body.planetIndex), vector.head.bounds.width,
                                      [ vector, body, self.star, self.forces[body.planetIndex] ]);

                    });
                    vector.on("mousedown", function(event) {
                        app.set('selectedPlanet', body.planetIndex + 1);
                        //                        var center = vector.head.bounds.center;
                        //                        vector.head.bounds.size = new Size(ARROW_DRAG_SIZE, ARROW_DRAG_SIZE);
                        //                        vector.head.bounds.center = center;
                    });
                    vector.on("mouseup", function(event) {
                        if (app.typeForBody(body.planetIndex) == TYPE_PLANET_FIXED)
                            return;
                        
                        if (app.flags.disabledVelocityDrag)
                            return;
                        
                        app.trigger("planet:dragvelocity");
                        vector.dragging = false;
                        //                        self.restoreSizes();
                    });
                    
                    handles.push({halo:halo, vector:vector});
                })(body, vector);
            }
        }

        for (i = 0; i < nplanets; i++) {

            var vx = velocity[NPHYS*(i+1)+X] * PIXELS_PER_AUPDAY;
            var vy = velocity[NPHYS*(i+1)+Y] * PIXELS_PER_AUPDAY;

            handles[i].halo.position = this.planets[i].position;
            handles[i].vector.setVector(this.planets[i].position, this.planets[i].position +
                                        new Point(vx, vy));

            if (app.typeForBody(i) == TYPE_PLANET_FIXED)
                handles[i].halo.visible = false;

            if (app.flags.disabledVelocity || app.typeForBody(i) == TYPE_PLANET_FIXED) {
                handles[i].vector.hide();
            }
            else
                handles[i].vector.show();

            self.showForces();
        }
    },

    destroyHandles: function() {
        var handles = this.handles;
        for (var i = 0; i < handles.length; i++) {
            handles[i].halo.remove();
            handles[i].vector.remove();
        }
        handles.length = 0;
        this.hideForces();
    },

    ticks: [],
    tickLengths:[],
    targetArcSize: 100,
    
    trailsUpdate: function() {
        if (!(app.get('state') == RUNNING || app.get('state') == ROTATABLE))
            return;

        var planets = this.planets;
        var tickLengths = this.tickLengths;
        
        if (planets.length == 0)
            return;

        var interactingSystem = app.interactingSystem();

        if (!this.computedTrailCoords && !interactingSystem) {
            this.computedTrailCoords = [];
            this.computedTrailPaths = [];
            var allEls = app.elements();

            for (var i = 0; i < planets.length; i++) {
                var els = allEls[i];
                var tc = [];
                var a = els.sma;
                var e = els.eccentricity;
                if (e > 0.98 && e < 1.01) {
                    this.computedTrailCoords[i] = [];                    
                    continue;
                }
                var r0 = els.r0;
                var lop = els.longPeri;
                var p = Math.abs(els.sma * (1-els.eccentricity * els.eccentricity));
                var lastp = null;
                var lastr = null;
                var dtheta = 0.1;

                var theta0 = Math.atan2(r0[1], r0[0]);
                var theta = theta0;
                var last = false;
                var hs = els.hs;

                while (Math.abs(theta - theta0) <= 2 * Math.PI) {                 
                    var r = p / (1 + e * Math.cos(theta - lop));
                    var x = r * Math.cos(theta);
                    var y = r * Math.sin(theta);
                    var z = 0;
                    
                    tc.push({ x : x, y : y, z : z});
                    if (isNaN(x) || isNaN(y)) {
                        console.warn('x and y are NaN', x, y, r, theta, p, e, lop);
                    }
                    
                    if (lastr) {
                        dtheta = dtheta * 10/(Math.abs(r-lastr) * PIXELS_PER_AU);
                        if (dtheta < 0.01) dtheta = 0.01;
                        if (dtheta > 0.1) dtheta = 0.1;
                    }
                    
                    lastr = r;
                    if (r * PIXELS_PER_AU < this.star.bodyRadius || last)
                        break;

                    if (dtheta > 2 * Math.PI - Math.abs(theta - theta0)) {
                        dtheta = 2 * Math.PI - Math.abs(theta - theta0) - 0.001;
                        last = true;
                    }
                    
                    theta += hs * dtheta;
                }
                if (e >= 1) {
                    tc.pop();
                }

                this.computedTrailCoords[i] = tc;
                console.log("Creating computed.");
                this.computedTrailPaths[i] = new ThreeDPath(tc, 1, this.color(TYPE_OUTLINE, i), planets[i], this.star, this.transformation);
            }

            
            var f = 0;
            var opacity = 0;
            this.pushAnimation('trailsFadeIn', function(arg) {
                if (! this.computedTrailPaths)
                    return false;
                f++;
                if (f > 20)
                    opacity = 1;
                else
                    opacity = Math.min(1, opacity += 1/20);

                for (var i = 0; i < this.computedTrailPaths.length; i++) {
                    this.computedTrailPaths[i].p.opacity = opacity;
                    this.computedTrailPaths[i].m.opacity = opacity;
                }

                if (f > 20 || arg == 'cancel')
                    return false;
                return true;
            });
            
            
        }

        var position = [];
        
        for (i = 0; i < planets.length; i++) {
            
            if (this.trailThetaTotal[i] > 2.*Math.PI && !interactingSystem) {
                if (this.computedTrails && this.computedTrailPaths[i]) {
                    this.computedTrailPaths[i].remove();
                    this.computedTrailCoords[i] = [];
                }
                continue;
            }
            
            var star = this.star;
            
            var tCoords = (this.trailCoords[i] || []);
            var path = (this.trailPaths[i] || new ThreeDPath(tCoords, 3, this.color(TYPE_HALO, i), planets[i], this.star, this.transformation));
            var tickLength = tickLengths[i] || 1;
            this.ticks[i] = this.ticks[i] || 0;
            
            
            var planet = planets[i];
            
            if (this.ticks[i] % tickLength != 0) {
                this.ticks[i]++;
                continue;               
            }
            
            if (tCoords.length > MAX_SEGMENTS) {
                    tCoords.shift();                
            }
            
            var lastPos;
            position = app.povPositionForBody(i, position);
            var theta = Math.atan2(position[Y], position[X]);
            var firstArc = false;
            
            if (tCoords.length == 0) {
                lastPos = planet.position;

                this.trailLastTheta[i] = theta+0.001;
                this.trailThetaTotal[i] = 0.;
                firstArc = true;
            }
            else
                lastPos = tCoords.point;
            
            var dt = Math.abs(this.trailLastTheta[i] - theta);
            if (dt == 0)
                continue;
            
            if (2 * Math.PI - dt < dt)
                dt = 2 * Math.PI - dt;
            
            this.trailLastTheta[i] = theta;
            this.trailThetaTotal[i] += dt;
            
            var els = this.model.get('elements');

            var a = els[i].sma;
            var e = els[i].eccentricity;
            var r = position[X]*position[X] +
                    position[Y]*position[Y];

            var arc2 = dt * dt * r * PIXELS_PER_AU_1 * PIXELS_PER_AU_1;
            var pt = tickLengths[i];
            if (!firstArc) {
                if (Math.abs(arc2 - this.targetArcSize)/this.targetArcSize > 0.1) {
                    if (arc2 - this.targetArcSize < 0)
                        tickLength++;
                    else
                        tickLength--;
                    
                    this.ticks[i] = 1;
                }
                if (tickLength < 1) tickLength = 1;
                tickLengths[i] = tickLength;
            }
            
            tCoords.push(
                { x: position[X], y: position[Y], z:position[Z]}
            );
            
            
            this.trailCoords[i] = tCoords;
            this.trailPaths[i] = path;
            path.update();
            this.ticks[i] ++;
        }
    },

    destroyTrails: function() {
        for (var j = 0; j < this.trailPaths.length; j++) {
            if (this.trailPaths[j])
                this.trailPaths[j].remove();
            if (this.computedTrailPaths && this.computedTrailPaths[j])
                this.computedTrailPaths[j].remove();
        }
        this.ticks = [];
        this.tickLengths = [];
        this.trailPaths = [];
        this.trailCoords = [];
        this.trailCenter = null;
        this.trailThetaTotal = _m.zeros(20);
        this.trailLastTheta = _m.zeros(20);
        this.computedTrailCoords = null;
        this.computedTrailPaths = null;
        this.cancelAnimation('trailsFadeIn');
    },
    
    
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
            if (!this.animations[i].f())
                this.animations.splice(i, 1);
        }
    },

    
    animateStar: function() {
        var start = 5;
        var N = 20;
        var dx = (2*this.star.bodyRadius-start)/N;
        var i = 1;
        var zoom = this.zoom;
        var star = this.star;
        star.visible = false;
        star.halo.visible = false;
        this.cancelAnimation('travel');
        
        this.pushAnimation('star', function(cmd) {
            var pos = app.povPositionForBody(-1);
            
            if (cmd == 'cancel') {
                star.bounds.width = 2*star.bodyRadius*zoom;
                star.bounds.height = 2*star.bodyRadius*zoom;
                star.halo.bounds.width = 2*star.haloRadius*zoom;
                star.halo.bounds.height = 2*star.haloRadius*zoom;

                
                
                star.position = view.center + new Point(pos[X], pos[Y]) * PIXELS_PER_AU;
                star.halo.position = view.center + new Point(pos[X], pos[Y]) * PIXELS_PER_AU;;
                star.visible = true;
                star.halo.visible = true;

                return false;
            }
            
            if (i == N)
                return false;
            star.bounds.width = i*dx + start;
            star.bounds.height = i*dx + start;
            star.halo.bounds.width = (i*dx+start) * star.haloRadius/star.bodyRadius;
            star.halo.bounds.height = (i*dx+start) * star.haloRadius/star.bodyRadius;
            
            star.position = view.center + new Point(pos[X], pos[Y]) * PIXELS_PER_AU;;
            star.halo.position = view.center + new Point(pos[X], pos[Y]) * PIXELS_PER_AU;;
            if (i == 1) {
                star.visible = true;
                star.halo.visible = true;
            }
            i++;
            return true;
        });
    },


    bobStar: function() {
        var i = 0;
        var fr = 20;
        var star = this.star;
        var zoom = this.zoom;
            
        this.pushAnimation('bobstar', function() {
            if (i == fr)
                return false;
            var pos = app.povPositionForBody(-1);

            
            star.bounds.width = zoom * star.bodyRadius * (2 + 0.2 * Math.sin(Math.PI*i/fr));
            star.bounds.height = zoom * star.bodyRadius * (2 + 0.2 * Math.sin(Math.PI*i/fr));
            star.position = view.center + new Point(pos[X], pos[Y]) * PIXELS_PER_AU;;
            i++;
            return true;
        });
    },
    
    update: function() {
        this.animationsTick();

        if (this.animating)
            return;
        
        this.starUpdate();
        this.planetsUpdate();
        this.handlesUpdate();
        this.trailsUpdate();
    },

    resize: function() {
        if (this.animating)
            return;
        
        this.update();
        this.destroyTrails();
        this.planetsUpdate();
        this.handlesUpdate();
        this.objectsUpdate();
        this.resetObjects();
    },
    
    // Mouse-down event on canvas. Forward message to appView.
    // Astrocentric coordinates are stored in events.position.
    onMouseDown: function(event) {
        if (!app.get('interactive'))
            return;
        
        var p = project.hitTest(event.point);
        if (p != null && (p.item == this.star || (app.get('physicalSizes') && p.item == this.star.halo)) && app.get('state') == PAUSED && !app.flags.disabledStar) {            
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
        if (app.get('state') != PAUSED)
            return;
    },

    onMouseUp: function(event) {
        this.dragDirection = null;
        
        if (app.get('interactive'))
            for (var i = 0; i < this.planets.length; i++) 
                this.planets[i].mouseUp();
    },
    
    onMouseDrag: function(event) {
        if (!app.get('interactive'))
            return;
        if (app.get('state') != ROTATABLE)
            return;

        if (!this.dragDirection) {
            if (Math.abs(event.delta.x) > Math.abs(event.delta.y))
                this.dragDirection = 'x';
            else
                this.dragDirection = 'y';
        }
        var dx = -event.delta.x;
        var dy = -event.delta.y;
        
        /*        if (this.dragDirection == 'y')
         dx = 0;
         else
         dy = 0;
         */
        
        var dI = dy * Math.PI / view.bounds.height;
        var dW = dx * Math.PI / view.bounds.width;
        
        Physics.setRotation(this.transformation,
                            this.transformation.I + dI,
                            0,
                            this.transformation.W + dW,              
                            PIXELS_PER_AU);
        this.rotateBackgroundStars();
        this.planetsUpdate();

        for (var i = 0; i < this.trailPaths.length; i++) {
            if (this.computedTrailPaths && this.computedTrailPaths[i]) {
                this.computedTrailPaths[i].update();
            }
            if (this.trailPaths[i]) {
                this.trailPaths[i].update();
            }
        }
        
        
        _.each(this.backgroundStars, function(s) {
            s.sendToBack();
        });
        this.transformation.stretch = PIXELS_PER_AU;
    },
    
    toggleState: function(event) {
        if (app.get('state') != PAUSED) {
            this.destroyHandles();            
        } else {
            this.destroyTrails();
        }
        
        
        if (app.get('state') == RUNNING)
            this.bobStar();
        
        if (app.get('state') == MENU) {
            this.fly();
            this.destroyObjects();
        }
        
    },

    resetView: function() {
        this.setZoom(1);
        this.autoZoom = true;
        this.resetTransformation();
        this.setSpeed(DEFAULT_SPEED);
        this.resetObjects();
    },

    objects: [],
    destroyObjects: function() {
        var objects = this.objects;
        _.each(objects, function(o) { o.remove(); });     
    },

    resetObjects: function() {
        this.destroyObjects();
        var objects = this.objects;
        var mission = app.mission();
        var c;
        if (mission.get('circleat')) {
            c = new Path.Circle({
                center: view.center,               
                radius: +mission.get('circleat') * PIXELS_PER_AU,  
                fillColor: 'rgba(102, 204, 255, 0.2)'
            });
            c.auradius = +mission.get('circleat');
            c.centered = true;
            objects.push(c);
            c.sendToBack();
        } else if (mission.get('circleoutside')) {
            var hole = new Path.Circle({
                        center: view.center,
                        radius: +mission.get('circleoutside') * PIXELS_PER_AU
            });
            c = new CompoundPath({
                children: [
                    new Path.Rectangle(view.bounds),
                    hole
                ],
                fillColor: 'rgba(102, 204, 255, 0.2)'
            });
            hole.auradius = +mission.get('circleoutside');
            hole.centered = true;
            objects.push(hole);
            objects.push(c);
            c.sendToBack();
        } else if (mission.get('dashedcircle')) {
            c = new Path.Circle({
                center: view.center,               
                radius: +mission.get('dashedcircle') * PIXELS_PER_AU,  
                strokeColor: 'rgba(102, 204, 255, 0.2)',
                strokeWidth: 5,
                dashArray: [10, 4]
            });
            c.auradius = +mission.get('dashedcircle');
            c.centered = true;
            objects.push(c);
            c.sendToBack();
        }
    },

    objectsUpdate: function() {
        _.each(this.objects, function(o) {
            if (o.centered)
                o.position = view.center;
        });
    },
    
    resetTransformation: function() {
        this.transformation = Physics.setRotation(this.transformation, 0, 0, 0, PIXELS_PER_AU); 
    },
    
    initialize: function() {
        var self = this;
        this.recalculateSizes();
        this.createBackgroundStars();
        
        var star = new Path.Circle({
            center: view.center,
            radius: this.calculateBodySize(1)
        });

        this.calculateBodySize(1, star);
        
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
            radius:star.haloRadius
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

        star.visible = false;
        star.halo.visible = false;
        
        this.star = star;
        this.planets = [];
        this.handles = [];
        this.trailPaths = [];
        this.trailCoords = [];
        this.animations = [];

        
        this.trailThetaTotal = _m.zeros(20);
        this.trailLastTheta = _m.zeros(20);

        this.resetView();
        

        this.listenTo(this.model, "change:state", this.toggleState);
        this.listenTo(this.model, "refresh change:nplanets change:state", function() {
            self.validatePlanet();
            if (app.get('state') == PAUSED) {
                self.planetsUpdate();
                self.handlesUpdate();
                self.trailsUpdate();
            }
        });
        this.listenTo(this.model, "change:masses", function() {
            self.recalculateSizes();
        });

        this.listenTo(this.model, "startLevel state:menu", function() {           
            this.resetView();            
        });

        this.listenTo(this.model, "reset state:menu", function() {
            this.destroyObjects();
        });
        
        this.listenTo(this.model, "startLevel", function() {
            this.cancelFly();
        });

        this.listenTo(this.model, "change:currentMission", this.animateTravel);
        //        this.listenTo(this.model, "change:state change:elements", this.trailsUpdate);
        this.listenTo(this.model, "collision", this.animateCollision);
        this.listenTo(this.model, "change:physicalSizes", function() {
            this.recalculateSizes();
        });

        this.bary = new Path.Star({
            center: view.center,
            points:6,
            radius1:4,
            radius2:8,
            fillColor:'black',
            strokeColor:'white',
            strokeWidth:2,
            locked:true
            
        });
        
        this.fly();
    }
});

draw = new Draw({model: app});


function onResize(event) {
    draw.resize();
};


var sampling = true;
if (IS_KIOSK) {
    sampling = false;
    STARS = 150;
    CLUSTERS = 5;
    draw.createBackgroundStars();
}

var samplingFrames = 0;
var samplingFramesCount = 20;
var samplingStart;
var targetFrameRate = 40;
var trials = 0;
var maxTrials = 3;

var FPS = 0;
var FPS_SAMPLE = false;
var FPS_STARTED = null;

window.measureFPS = function() {
    FPS_SAMPLE = !FPS_SAMPLE;

    if (!FPS_SAMPLE) {
        FPS = FPS/(new Date() - FPS_STARTED) * 1000;
        console.log('FPS', FPS);
        return FPS;
    } else {
        FPS_STARTED = new Date();
        return null;
    }
}

function onFrame(event) {
    if (!app.get('alive')) {
        return;
    }

    if (FPS_SAMPLE) {
        FPS++;
    }
    
    if (sampling) {
        if (trials > maxTrials) {
            sampling = false;
            app.trigger('sampled');
            SLOW_ENV = true;
        }
        if (samplingFrames == 0)
            samplingStart = new Date();
        else if (samplingFrames == 100) {
            var perf = samplingFrames / (new Date() - samplingStart) * 1000;
            console.log(perf, STARS, MAX_SEGMENTS);

            if (perf >= targetFrameRate) {
                sampling = false;
                app.trigger('sampled');
            } else {
                STARS = (STARS * 0.5 * (1 + perf / targetFrameRate))|0;
                MAX_SEGMENTS = (MAX_SEGMENTS * 0.5 * (1 + perf / targetFrameRate))|0;
                draw.createBackgroundStars();
                
                samplingFrames = 0;
                samplingStart = new Date();
            }
            trials++;
        }
        samplingFrames++;
    }
    
    if (app.get('state') != PAUSED) {
        app.tick();
    }

    draw.update();
}

if (IS_KIOSK)
    DEFAULT_SPEED = 2;

onMouseDown = _.bind(draw.onMouseDown, draw);
onMouseMove = _.bind(draw.onMouseMove, draw);
onMouseDrag = _.bind(draw.onMouseDrag, draw);
onMouseUp = _.bind(draw.onMouseUp, draw);

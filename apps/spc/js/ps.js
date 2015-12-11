function center() {
    var p = new Point();
    p.x = view.center.x + 150;
    p.y = view.center.y;
    return p;
}

var scaleCircle = new Path.Circle({
    opacity:0.5,
    strokeColor:'white',
    radius:SCALE*UI.maxSemiMajorAxis(),
    center:center()
});



var habCircle = new Path.Circle({
    opacity:0.2,
    strokeColor:COLORS[0],
    radius:SCALE*0.5*(Math.sqrt(HABITABLE_ZONE_MIN_2)+Math.sqrt(HABITABLE_ZONE_MAX_2)),
    strokeWidth:SCALE*0.5*(Math.sqrt(HABITABLE_ZONE_MAX_2)-Math.sqrt(HABITABLE_ZONE_MIN_2)),
    center:center()
});
habCircle.initialShow = true;


var tail = [];
var bodies = [];

var BODY_SCALE = 3.5;


var helpLabel = new PointText({
    content : "Tap anywhere to add a planet.",
    justification : "center",
    font : 'Exo',
    fontSize : 22,
    fillColor : 'white',
    visible:true,
    opacity: 0.4
});

var help2Label = new PointText({
    content : "Keep all the planets inside this circle.",
    justification : "center",
    font : 'Exo',
    fontSize : 22,
    fillColor : 'white',
    visible:true,
    opacity: 0.4
});


var habLabel = new PointText({
    content : "Habitable zone",
    justification : "center",
    font : 'Exo',
    fontSize : 16,
    fillColor : 'white',
    visible:true,
    opacity: 0.4
});

var scaleLabel =  new PointText({
    content : UI.maxSemiMajorAxis().toFixed(2) + " AU",
    justification : "center",
    font : 'Exo',
    fontSize : 16,
    fillColor : 'white',
    visible:true,
    opacity: 0.4
});


var nb = 1;

initView();
bodies[0].scale(UI.mtor(System.xyz[0][M])/UI.mtor(K2)*BODY_SCALE);
bodies[0].visible = true;
bodies[0].hasRadius = true;


function initView() {
    for (var i = 0; i < tail.length; i++)
        tail[i].remove();
    for (i = 0; i < bodies.length; i++)
        bodies[i].remove();
    console.log("Initializing view...");
    tail.length = 0;
    bodies.length = 0;
    
    for (i = 0; i < NBODIES; i++)
        tail.push(new Path({
            strokeColor:COLORS[i],
            strokeWidth:10,
            strokeCap:'round',
            opacity:0.2
        }));

    for (i = 0; i < NBODIES; i++)
        bodies.push(new Path.Circle({
            visible:false,
            radius:10,
            fillColor:COLORS[i],
            center:center(),
            hasRadius: false
        }));
}


function onResize(event) {
    //    background.bounds = view.bounds;
    scaleCircle.position = center();
    habCircle.position = center();
    for (var i = 0; i < NBODIES; i++)
        tail[i].removeSegments();

    helpLabel.position = new Point(center().x,
                                   habCircle.bounds.top - 60);
    help2Label.position = new Point(center().x,
                                    habCircle.bounds.bottom + 60);
    habLabel.position = new Point(center().x,
                                  habCircle.bounds.top + 15);
    scaleLabel.position = new Point(center().x,
                                    scaleCircle.bounds.bottom - 15);
}

function hideHelp() {
    helpLabel.visible = false;
    help2Label.visible = false;
    habLabel.visible = false;
    habCircle.initialShow = false;
}

function smokeAt(point, index) {
    var circle = new Path.Circle({
        radius:10,
        fillColor:COLORS[index],
        center:new Point(point.x, point.y),
        opacity:0.8
    });
    var timer = setInterval(function(){
        var fac = 0.7;
        circle.opacity *= fac;
        circle.scale(0.8/fac);
        if (circle.opacity < 0.01) {
            circle.remove();
            clearInterval(timer);
        }
    }, 30);
}

function textAt(point, index, text) {
    text = text || UI.planetType();
    var plLabel = new PointText({
        content : text,
        justification : "center",
        font : 'Exo',
        fontSize : 20,
        fillColor : COLORS[index],
        visible:true,
        opacity: 1
    });
    plLabel.position = new Point(point.x, point.y - 30);

    var timer = setInterval(function() {
        var fac = 0.95;
        plLabel.opacity *= fac;
        plLabel.position = new Point(plLabel.position.x, plLabel.position.y-1);
        if (plLabel.opacity < 0.01) {
            plLabel.remove();
            clearInterval(timer);
        }
    }, 15);
}

addPlanet = function(point) {
    console.log(point);
    var p = (point-center())/SCALE;
    UI.addPlanetAt(p.x, p.y);
    smokeAt(point, nbodies-1);
    if (nbodies == NBODIES) {
        textAt(point, nbodies-1, "Max number of planets reached.");
        return;
    }
    
    textAt(point, nbodies-1);
};

if (UIUtils.touchDevice) {
    $("#universe").on("touchstart", function(e) {
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        hideHelp();
        addPlanet(new Point(touch.pageX, touch.pageY));
        e.preventDefault();
    });
} else {
    $("#universe").on("mousedown", function(e) {
        hideHelp();
        addPlanet(new Point(e.clientX, e.clientY));
    });
}


var t = 0;
var frame = 0;

function onFrame(event) {
    t += 0.1;
    if (VIEW_ONLY)
        hideHelp();
    if (RESET_VIEW) {
        initView();
        RESET_VIEW = false;
    }
    
    if (CRASHED_BARRIER) {
        scaleCircle.scale(1 + 0.01 * Math.sin(t/0.15));
    }
    if (!habCircle.initialShow)
        habCircle.opacity = 0.01*IN_HABITABLE;
    
    if (STOPPED)
        return;
    
    var xyz = UI.evolve();
    if (xyz == null)
        return;
    
    for (var i = 0; i < nbodies; i++) {
        bodies[i].position.x = (xyz[i][X])*SCALE+center().x;
        bodies[i].position.y = (xyz[i][Y])*SCALE+center().y;
        
        if (!bodies[i].hasRadius) {
            bodies[i].visible = true;
            bodies[i].scale(UI.mtor(xyz[i][M])/UI.mtor(K2)*BODY_SCALE);
            bodies[i].hasRadius = true;
            bodies[i].opacity = 1;
        }
        tail[i].addSegment(new Point(bodies[i].position.x, bodies[i].position.y));

        if (tail[i].segments.length > TAIL_LENGTH)
            tail[i].removeSegment(0);
        if (frame == 5) {
            tail[i].smooth();
            frame = 0;
        } else
            frame++;
    }

    UI.check();
}

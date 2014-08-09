var star = new Path.Circle({
    center: view.center,
    radius:200
});

star.fillColor = {
    gradient: {
        stops:[[COLOR_SUN_INNER, 0.075],[COLOR_SUN_OUTER, 0.15],[COLOR_SUN_OUTER2, 0.15], [COLOR_SUN_HALO_INNER, 0.18], [COLOR_SUN_HALO_OUTER, 1]],
        radial:true
    },
    origin: star.position,
    destination: star.bounds.rightCenter
};

var planet = new Path.Circle({
    center: view.center,
    radius:10
});

planet.fillColor = {
    gradient: {
        stops:[['blue', 0.5],['black', 1]],
        radial:true
    },
    origin: planet.bounds.leftCenter,
    destination: planet.bounds.rightCenter
};

function onResize(event) {
    console.log("HI");
    starUpdate();
    planetUpdate();
};

var t = 0;

function onFrame(event) {
    t = t + 0.01;
    planet.position.x = 200 * Math.cos(t);
    planet.position.y = 200 * Math.sin(t);
    planet.position += view.center;
    planetUpdate();
    
//    starUpdate();
//    planetUpdate();
}

function starUpdate() {
    star.position = view.center;
}

function planetUpdate() {
    var dx = planet.position.x - star.position.x;
    var dy = planet.position.y - star.position.y;

    var angle = Math.atan2(dy, dx);
    planet.fillColor.origin = new Point(planet.position.x - 10*Math.cos(angle),
                                        planet.position.y - 10*Math.sin(angle));
    planet.fillColor.destination = new Point(planet.position.x + 10*Math.cos(angle),
                                             planet.position.y + 10*Math.sin(angle));
    
}

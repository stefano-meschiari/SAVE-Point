// Physics
var M = 0;
var X = 1;
var Y = 2;
var Z = 3;
var U = 4;
var V = 5;
var W = 6;
var NCOORDS = 7;
var NPHYS = 4;

var AU = 1.4959787e13;
var MSUN = 1.98892e33;
var MJUP = 1.8986e30;
var MEARTH = 5.97219e27;
var RJUP = 7.1e9;
var RSUN = 6.96e10;
var REARTH = 6.3e8;

var GGRAV = 6.67384e-8;
var MIN_DISTANCE = 300 * RJUP/AU;

var DAY = 8.64e4;
var TWOPI = 6.2831853072e+00;
var SQRT_TWOPI = 2.5066282746e+00;
var K2  = ((GGRAV * MSUN * DAY * DAY) / (AU*AU*AU));
var YEAR = 31556926.;

NBODIES = 12;
nbodies = 1;

// Represents the planetary system and evolves the system with time.
var System = (function() {  
    var xyz = [];
    var f = [];
    var f_1 = [];
    var ui = null;
    var com = new Float64Array(NCOORDS);
    
    var init = function(uiobj) {
        // Initialize arrays
        var i;
        xyz.length = 0;
        f.length = 0;
        f_1.length = 0;
        t = 0;
        for (i = 0; i < NBODIES; i++) {
            xyz.push(new Float64Array(NCOORDS));
            f.push(new Float64Array(NPHYS));
            f_1.push(new Float64Array(NPHYS));
        };
        nbodies = 1;
        // Initialize star
        xyz[0][M] = 1.*K2;
        
        force();
        ui = uiobj;
    };
    

    var addPlanet = function(mass_msun, x, y, vx, vy) {
        if (nbodies >= NBODIES)
            return;
        else {
            xyz[nbodies][X] = x;
            xyz[nbodies][Y] = y;
            

            x -= xyz[0][X];
            y -= xyz[0][Y];
            
            
            var r = Math.sqrt(x*x + y*y);
            xyz[nbodies][M] = mass_msun * K2;
            var v = Math.sqrt((xyz[0][M]+xyz[nbodies][M])/r);
            
            if (vx === undefined) {                
                xyz[nbodies][U] = v * (-y/r);
                xyz[nbodies][V] = v * (x/r);
            } else {
                xyz[nbodies][U] = vx;
                xyz[nbodies][V] = vy;
            }
            nbodies++;

            
            force();
        }

    };

    
    var center = function() {
        var i, j;
        for (i = 0; i < NCOORDS; i++)
            com[i] = 0.;
        for (i = 0; i < nbodies; i++) {
            com[M] += xyz[i][M];
            for (j = 0; j < NCOORDS; j++) 
                com[j] += xyz[i][j]*xyz[i][M];
        }

        com[X] /= com[M];
        com[Y] /= com[M];
        com[Z] /= com[M];
        com[U] /= com[M];
        com[V] /= com[M];
        com[W] /= com[M];
        
        for (i = 0; i < nbodies; i++)
            for (j = X; j <= W; j++)
                xyz[i][j]-=com[j];
    };

    var force = function() {
        var i, j;

        for (i = 0; i < nbodies; i++) {
            f_1[i].set(f[i]);
            for (j = 0; j < NPHYS; j++)
                f[i][j] = 0.0;
        }
        
        for (i = 0; i < nbodies; i++) {
            
            for (j = i + 1; j < nbodies; j++) {
                var m1 = xyz[i][M];
                var m2 = xyz[j][M];
                var x = (xyz[i][X] - xyz[j][X]);
                var y = (xyz[i][Y] - xyz[j][Y]);
                var z = (xyz[i][Z] - xyz[j][Z]);
                
                var i_rsq = 1./(x*x+y*y+z*z);
                
                var i_r = Math.sqrt(i_rsq);
                
                if (i_r < MIN_DISTANCE) {
                    UI.crash(i, j);
                    return;
                }
                
                var a1 = -m2 * i_rsq * i_r;
                var a2 = -m1 * i_rsq * i_r;
                
                    
                f[i][X] += x * a1;
                f[j][X] -= x * a2;
                    
                f[i][Y] += y * a1;
                f[j][Y] -= y * a2;
                    
                f[i][Z] += z * a1;
                f[j][Z] -= z * a2;
            }        
        }
    };

    var t = 0.;
    var dt = 0.5;
    var dt2 = dt*dt;

    var setDt = function(new_dt) {
        dt = new_dt;
        dt2 = dt*dt;
    };

    var setMstar = function(new_Mstar) {
        xyz[0][M] = new_Mstar * K2;
    };
    
    var evolve = function(n) {
        n = n | 1;
        for (var rep = 0; rep < n; rep++) {
            
            var d;

            // xyz step
            for (i = 0; i < nbodies; i++) 
                for (d = X; d <= Z; d++)
                    xyz[i][d] += xyz[i][d+3] * dt + 0.5 * dt2 * f[i][d];
            
            force();

            // uvw step
            for (i = 0; i < nbodies; i++) {
                for (d = X; d <= Z; d++) {
                    xyz[i][d+3] += 0.5 * dt * (f[i][d] + f_1[i][d]);
                }
            }
            t += dt;
        }
        
        
        return xyz;
    };

    var print = function() {
        for (var i = 0; i < nbodies; i++) {
            console.log(xyz[i][0]-xyz[0][0], xyz[i][1]-xyz[0][1], xyz[i][2]-xyz[0][2], xyz[i][3]-xyz[0][3], xyz[i][4]-xyz[0][4], xyz[i][5]-xyz[0][5], xyz[i][6]-xyz[0][6]);
            console.log(Math.sqrt(sqr(xyz[i][X]-xyz[0][X]) +sqr(xyz[i][Y]-xyz[0][Y]) ));
        }
        console.log(nbodies, t);

        console.log('-----------------');
    };
    
    var benchmark = function() {
        addPlanet(0.001, 1.5, 0);
        addPlanet(0.001, 1.5, 0);
        addPlanet(0.001, 1.5, 0);
        addPlanet(0.001, 1.5, 0);
        addPlanet(0.001, 1.5, 0);
        
        center();
        
        console.time('Start');
        evolve(100000);
        console.timeEnd('Start');
        alert();        
        return;
    };

    var time = function() {
        return t;
    };

    var setTime = function(tt) {
        t = tt;
    };
    
    var masses = function() {
        var m = [];
        for (var i = 0; i < nbodies; i++)
            m[i] = xyz[i][M];
        return m;
    };
    
    return {init:init, xyz:xyz, evolve:evolve, addPlanet:addPlanet, benchmark:benchmark, print:print, time:time, setTime: setTime, center:center, masses:masses, setDt:setDt, setMstar:setMstar};
   
})();

Math.log10 = function(v) {
    return Math.log(v)/Math.LN10;
};

// UI global configuration variables
TAIL_LENGTH = 200;
SPEED = 8;
STOPPED = false;
CLICKED = false;
CRASHED_BARRIER = false;
VIEW_ONLY = (_.parameter("view") != null);
IS_MOBILE = (_.parameter("mobile") != null);
IS_TEMPLATE = (_.parameter("np") != null);
RESET_VIEW = false;

HABITABLE_ZONE_MIN_2 = 0.723*0.723;
HABITABLE_ZONE_MAX_2 = 1.524*1.524;
IN_HABITABLE = 0;

ADD_CIRCLE_AT = -1;

MAX_SPEED = 128;

var UI = (function() {
    var curPoints = 0;

    var minMass = MEARTH/MSUN;
    var maxMass = 0.1;
    var minSma = 0.02;
    var maxSma = 2;
    var minSmaClick = 0.15*maxSma;    
    var maxSmaClick = 0.98 * maxSma;
    var maxYears = 500;
    var curMass = MEARTH/MSUN;
    var curPlanetType = "1x\nEarth";
    var history = [];
    var viewHistory = null;
    var crowd_multiplier = 1.;
    var hab_multiplier = 1.;
    var token = 0;
    
    function init() {
        
        
        if (! VIEW_ONLY && ! IS_TEMPLATE) {
            addFirstPlanet();
        } else if (VIEW_ONLY) {
            MIRRORED = 1;
            $("#cfg").html("You are watching the pre-recorded evolution of this system. Sit back and relax...<hr>");
            $.get("hiscore.php",
                  {view:_.parameter("view"), token:token},
                  function(data) {
                      console.log(data);
                      viewHistory = JSON.parse(data);
                      $("#popup").hide();
                      $("#pop-help").hide();
                  });
            
        } else if (_.parameter("np")) {
            maxSma = 0.1;
            
            for (var n = 1; n <= _.parameter("np")|0; n++) {
                var x = +_.parameter("x"+n);
                var y = +_.parameter("y"+n);
                var vx = +_.parameter("vx"+n);
                var vy = +_.parameter("vy"+n);
                var mass = +_.parameter("m"+n);

                // Change this to actually calculate apocenter distance
                maxSma = Math.max(maxSma, 1.25*Math.sqrt(x*x+y*y));

                addPlanetAt(x, y, vx, vy, mass, true);
            }
            System.center();
            SPEED = +_.parameter("speed");
            if (_.parameter("dt"))
                System.setDt(+_.parameter("dt"));
            maxSmaClick = 0.98*maxSma;
            minSmaClick = 0.05*maxSma;
        }
        
        SCALE = 0.48 * Math.min(window.innerHeight, window.innerWidth)/maxSma;


        /*
        $.get("hiscore_today.php?get=get", null, function(data) {
            $("#highscores-list").html("Today's high score: <strong>" + data + "</strong>");
        });
        */
        $(".mass-sel").click(function() {
            curMass = ($(this).data("points"))|0;
            curMass *= MEARTH/MSUN;
            curPlanetType = $(this).text();
            $('#masses li.active').removeClass('active');
            $(this).parent('li').addClass('active');
        });

        $("#pause").click(function() {
            STOPPED = !STOPPED;
            if (STOPPED) {
                $("#pause").html('<span class="glyphicon glyphicon-play"></span>');
            } else {
                $("#pause").html('<span class="glyphicon glyphicon-pause"></span>');
            }
        });
        $("#stop").off('click').click(stop);

        $("#help").click(function() {
            $("#popup").show(500);
            $("#pop-help").show();
            $("#pop-why").hide();
            $("#pop-points").hide();
        });

        $("#close-help").click(function() {
            $("#popup").hide(500);
        });
        
        $("#pop-highscores").hide();
        $("#pop-points").hide();

        $("#screenshot").click(function() {
            var canvas = document.getElementById("universe");
            var context = canvas.getContext('2d');
            context.fillStyle = 'white';
            context.font = '16px Exo';
            context.fillText('Super Planet Crash - Brought to you by Stefano Meschiari - http://www.stefanom.org/spc', 20, 30);
            var img = canvas.toDataURL("image/png");
            window.open(img, "_blank");
        });

        $("#hiscore-form").submit(function(e) {
            e.preventDefault();
            $("#hiscore-submit").css("disabled", "true");
            $("#hiscore-submit").html("Submitting...");
            $("#hiscore-points").val(points());
            $("#hiscore-years").val(years());
            if ($("#hiscore-name").val().trim() == "") {
                alert("Insert a name.");
                return;
            }

            var data = {};
            data['hiscore-points'] = points();
            data['hiscore-years'] = years();
            data['hiscore-name'] = $("#hiscore-name").val();
            data['history'] = JSON.stringify(history);
            
            $.post('hiscore.php?token=' + token,
                $(this).serialize(),
                function(data) {
                    
                    alert("High score saved!\nYou are in position #" + ((data|0)+1));
                    location.href = BASEURL;
                }
            );
        });

        $("#hiscore-url-full").click(function() {
            $(this).select();
        });

        $("#faster").click(function() {
            SPEED*=2;
            if (SPEED > MAX_SPEED)
                SPEED = MAX_SPEED;
        });
        $("#slower").click(function() {
            SPEED = Math.round(0.5*SPEED);
            if (SPEED < 1)
                SPEED = 1;
        });
        $("#templates").click(function() {
            location.href="templates.html";
        });

        $("#newgame").click(function() {
            UI.restart();
        });

        $("a.spc").attr("href", BASEURL);
        $("#maxAU").html(maxSemiMajorAxis().toFixed(2));
    }

    var updateDisplay = _.throttle(function() {
        $("#time").html("Years:<br>" + UI.years() + "/500");
        $("#points").html("Points:<br>" + _.numberWithCommas(UI.points()));
        $("#bonus").html("Crowdedness bonus: " + crowd_multiplier.toFixed(1) + "x<br>" +
                         "Habitability bonus: " + hab_multiplier.toFixed(1) + "x<br>" +
                        "Speed: " + SPEED + "x");
    }, 1000);
    
    function evolve() {
        if (VIEW_ONLY && viewHistory == null)
            return null;
        var ret;

        for (var i = 0; i < SPEED; i++) {
            addPoints(1);
            
            if (VIEW_ONLY) {
                var j = viewHistory.length-1;
                while (j >= 0) {
                    if (viewHistory[j].mstar) {
                        System.xyz[0][M] = viewHistory[j].mstar * K2;
                    } else if (viewHistory[j].time == System.time()) {
                        
                        curMass = +viewHistory[j].mass;
                        addPlanetAt(+viewHistory[j].x, +viewHistory[j].y, +viewHistory[j].u,
                                   +viewHistory[j].v, false, false, !viewHistory[j].corr);
                        viewHistory.splice(j, 1);
                    }

                    j--;
                }
            }
           
            ret = System.evolve();
        }

        updateDisplay();

        return ret;
    };

    function addPoints(n) {
        if (nbodies < 3)
            return;
        
        var p = 0;
        var xyz = System.xyz;
        var r = [];
        hab_multiplier = 1.;
        IN_HABITABLE = 0;
        for (i = 1; i < nbodies; i++) {
            p += (xyz[i][M] / K2)*MSUN/MEARTH;
            var rad = (xyz[i][X]*xyz[i][X] + xyz[i][Y]*xyz[i][Y]);
            r[i-1] = rad;
            if (rad > HABITABLE_ZONE_MIN_2 && rad < HABITABLE_ZONE_MAX_2) {
                hab_multiplier ++;
                IN_HABITABLE++;
            }
        }


        if (nbodies > 2) {
            crowd_multiplier = Math.max(Math.min(1/_.sd(r), 10), 1);
        }
        p *= n/(5*365.25) * crowd_multiplier * hab_multiplier;
        curPoints += p;
    }

    var lastSync = -1;
    function sync() {
        if (nbodies != lastSync) {
            $("#nplanets").text(nbodies + " / " + NBODIES + " bodies");
            var xyz = System.xyz;
            $("#planets-list").html('');
            
            for (var i = 1; i < nbodies; i++) {
                var Ma = ' [' + (xyz[i][M] / K2 * MSUN / MEARTH).toFixed(0) + " M<sub>earth</sub>] ";
                var div = $('<div class="planet" id="pla' + (i) + '">' +
                        '<span style="color:' + COLORS[i] + '"> Planet ' +
                            (i) + Ma + "</span>"
                        + '</div>');
                $("#planets-list").append(div);
            }
            lastSync = nbodies;
        }
    }
        
    function addPlanetAt(x, y, vx, vy, mass, noCenter, correctForHistoryBug) {
        
        if (nbodies == NBODIES)
            return;

        var r = Math.sqrt(x*x + y*y);
        if (r < minSmaClick && !noCenter) {
            x *= minSmaClick/r;
            y *= minSmaClick/r;
        } else if (r > maxSmaClick) {
            return;
        }
        
        if (!mass)
            mass = curMass;

        if (correctForHistoryBug) {
            var coords = [];
            var mk2 = mass * K2;
            var mm = 0.;
            var xyzCur = System.xyz;
            coords[X] = coords[Y] = coords[Z] = coords[U] = coords[V] = coords[W] = 0.;
            
            for (var i = 0; i < nbodies; i++) {
                mm += xyzCur[i][M];
                for (var coord = X; coord <= W; coord++) {
                    coords[coord] += xyzCur[i][coord] * xyzCur[i][M];
                }
            }
            var mt = mm + mk2;
            
            x = (x + coords[X]/(mm + mk2))/(1.-mk2/(mm+mk2));
            y = (y + coords[Y]/(mm + mk2))/(1.-mk2/(mm+mk2));
            vx = (vx + coords[U]/(mm + mk2))/(1.-mk2/(mm+mk2));
            vy = (vy + coords[V]/(mm + mk2))/(1.-mk2/(mm+mk2));
            
            console.log("Correcting for history bug.");
        } else {
            console.log("No correction.");
        }

        System.addPlanet(mass, x, y, vx, vy);

        
        xyz = System.xyz;
        
        history.push({
            time: System.time(),
            mass: curMass.toFixed(20),
            x: xyz[nbodies-1][X].toFixed(20),
            y: xyz[nbodies-1][Y].toFixed(20),
            z: xyz[nbodies-1][Z].toFixed(20),
            u: xyz[nbodies-1][U].toFixed(20),
            v: xyz[nbodies-1][V].toFixed(20),
            w: xyz[nbodies-1][W].toFixed(20),
            corr:true
        });

        if (!noCenter)
            System.center();
        
        sync();

        if (nbodies == 3) {
            CLICKED = true;
            curPoints = 0;
            System.setTime(0);
        }
    };
    
    function points() {
        return Math.round(curPoints);
    }

    function pointsTally() {
        var p = points();
        return p;
    }

    function mtor(m_int) {
        m_int /= K2;
        var m_j = m_int * MSUN/MJUP;
        var r_j;
        if (m_j > 0.29 && m_j < 13) {
            r_j = 1.;
        } else if (m_j < 0.29) {
            r_j = Math.sqrt(m_j * MJUP/MEARTH) * REARTH/RJUP;
        } else if (m_j > 13) {
            r_j = Math.sqrt(m_int) * RSUN/RJUP;
        }

        r_j = Math.floor(20*Math.pow(r_j, 0.25));

        return r_j;
    }

    function years() {
        if (!CLICKED)
            return 0;
        
        return (System.time()/365.25).toFixed(1);
    }

    function stop() {
        STOPPED = true;

        $("#pause").attr("disabled", true);
        $("#stop").hide();
        $("#help").hide();

        if (VIEW_ONLY)
            return;

        $("#pop-help").hide();
        $("#pop-points").show();
        $("#pop-points-tot").text(_.numberWithCommas(pointsTally()));
        $("#pop-years-tot").text(years());
        $("#popup").show(500);
        /*
        var hiscorer = false;
        $.get('hiscore_today.php?points=' + pointsTally() + '&years=' + years() + '&nbody=' + nbodies, null, function(max) {
            var pt = (+max)|0;
            if (pt == (pointsTally()|0) && pt > 0) {
                $("#pop-hiscore").html('<hr><i class="glyphicon glyphicon-certificate"></i> You are today\'s top scorer!');
                hiscorer = true;
            }

            _.delay(function() {
                if (STOPPED)
                    restart();
            }, (hiscorer ? 30 : 15) * 1000);
        });
        */
    }

    
    function pause() {
        STOPPED = !STOPPED;
    }

    function crash(i, j) {
        $("#pop-why").show();
        $("#pop-why").html("Bodies " + i + " and " + j + " crashed!<hr>");
        stop();
    }
    
    function check() {
        var x = System.xyz;
        for (var i = 0; i < nbodies; i++) {
            if (x[i][X]*x[i][X] + x[i][Y]*x[i][Y] > maxSma*maxSma) {
                STOPPED = true;
                $("#pop-why").show();
                $("#pop-why").html("Body #" + i + " crashed against the barrier at " + maxSma.toFixed(2) + " AU!<hr>");                
            }
        }
        if (STOPPED) {
            CRASHED_BARRIER=true;
            _.delay(stop, 2000);
        }

        if (years() > maxYears) {
            $("#pop-why").show();
            $("#pop-why").html("Congrats! You reached " + maxYears + " years without going unstable!<hr>");
            _.delay(stop, 2000);
        }
        
    }

    function planetType() {
        return curPlanetType;
    }

    function maxSemiMajorAxis() {
        return maxSma;
    }

    function restart() {
        if ($("hiscore-name").val() != "") {
            $.post("hiscore.php?action=add", {
                name: $("#hiscore-name").val(),
                points: UI.points()
            });
        }
        
        location.href="templates.html";
        return;
        /*

        Use this if you don't want to use reload.
         
        if (IS_TEMPLATE || VIEW_ONLY) {
            location.href = BASEURL;
            return;
        }

        RESET_VIEW = true;
        System.init(UI);
        STOPPED = false;
        CRASHED_BARRIER = false;
        SPEED = 8;
        
        curPoints = 0;
        history.length = 0;
        crowd_multiplier = 1.;
        hab_multiplier = 1.;
        
        $("#popup").hide();
        $("#stop").text("End game");
        $("#stop").off('click').click(function() {
            UI.stop();
        });
        $("#masses li").removeClass('active');
        $("#mass-earth").addClass('active');
        $("#pause").attr("disabled", false);
        
        addFirstPlanet();
         */
    }

    function addFirstPlanet() {
        var a = minSmaClick + Math.random() * (maxSmaClick - minSmaClick);
        curMass = MEARTH/MSUN;
        curPlanetType = "1x\nEarth";
        addPlanetAt(a, 0);        
    }

    function setToken(tok) {
        token = tok;
    }
    
    return {init:init, evolve:evolve, mtor:mtor, years:years,
           points:points, addPlanetAt:addPlanetAt, stop:stop,
           crash:crash, check:check, planetType:planetType, maxSemiMajorAxis:maxSemiMajorAxis,
           restart: restart, addFirstPlanet: addFirstPlanet,
           setToken: setToken};
})();



$(document).ready(function() {
    System.init(UI);
    UI.init();

    if (_.parameter("benchmark"))
        System.benchmark();

    if (UIUtils.touchDevice) {
        $(".mass-sel btn").on("touchstart touchmove", function(e) {
            $(this).trigger('click');
            e.preventDefault();
        });
        
         $("body").on("touchmove", function(e) {
             e.preventDefault();
         });
    }
});

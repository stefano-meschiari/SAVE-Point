"use strict";

var Physics = {};
var K2 = Units.K2;

/*
 * Augment Math with a few useful functions.
 
 */

/*
 * Return the sign of the argument.
 */
Math.sign = Math.sign || function(x) {
    return (x > 0 ? 1 : (x < 0 ? -1 : 0));
};

/*
 * Clamps the argument within 0 to 2*PI.
 */
Math.radRange = function(x) {
    while (x < 0)
        x += 2.*Math.PI;
    if (x > 2.*Math.PI)
        x = x % (2.*Math.PI);
    return x;
};

/*
 * Converts radians to degrees.
 */
Math.rad2deg = function(x) {
    return x*180/Math.PI;
};

/*
 * Solve the Kepler equation for given mean anomaly and eccentricity.
 */
Physics.keplerEquation = function(M, e, options) {
    var tol = (options && options.keplerTol) || 1e-3;
    var max_steps = (options && options.keplerMaxStep) || 10;

    
    var E = (e < 0.8 ? M : Math.PI);
    var f_E = Number.MAX_VALUE;
    var step = 0;
    do {
        f_E = E - e*Math.sin(E) - M;
        E = E - f_E / (1 - e*Math.cos(E));
        step++;
    } while (Math.abs(f_E) > tol && step < max_steps);

    return E;
};


/*
 * Converts cartesian coordinates into osculating astrocentric orbital elements. Assumes
 * the cartesian coordinates are centered on the star.
 */
Physics.x2el = function(s, t, M, x, y, z, u, v, w, els) {
    els = els || {};

    var GMm = K2 * (s.Mstar + M);

    var R = Math.sqrt(x*x + y*y + z*z);
    var V = Math.sqrt(u*u + v*v + w*w);
    
    var h_Z = x*v - y*u;
    var h_X = y*w - z*v;
    var h_Y = z*u - x*w;
    var h = Math.sqrt(h_X*h_X + h_Y*h_Y + h_Z*h_Z);
    var hs = Math.sign(h_Z);
    var Rs = Math.sign(x*u + y*v + z*w);
    var Rd = Rs * Math.sqrt(V*V - h*h/(R*R));
    console.log(hs, h_Z);
    var a = 1./(2./R - V*V/GMm);
    var e = Math.sqrt(1 - (h*h)/(GMm*a));
    var f = Math.atan2(a*(1-e*e)/(h*e) * Rd, 1/e*(a*(1-e*e)/R -1)) * Math.sign(h_Z);

    var i, O, E, lop, sini;

    if (s.twoD) {
        i = 0;
        sini = 0;
    } else {
        i = Math.acos(h_Z/h);
        sini = Math.sin(i);
        
        var sinO = hs*h_X/(h * sini);
        var cosO = -hs*h_Y/(h * sini);
        O = Math.atan2(sinO, cosO);
    }

    
    if (e > 1e-6) {
        var cosE = (1-R/a)/e;
        if (cosE < -1.) cosE = -1.;
        if (cosE > 1.) cosE = 1.;
        E = Math.acos(cosE);
        if (f > Math.PI)
            E = 2.*Math.PI - E;
        M = E - e*Math.sin(E);

        if (i > 1e-6) {
            var sinof = z/(R * sini);
            var cosof = 1./Math.cos(O) * (x/R + Math.sin(O) * sinof * Math.cos(i));
            var o = Math.atan2(sinof, cosof) - f;
            lop = O + o;
        } else {
            var theta = Math.atan2(y/R, x/R);
            lop = theta - f;
        }
        
    } else {
        E = M = f;
        lop = O;
    }
    
    els.M = M;
    els.sma = a;
    els.eccentricity = e;
    els.inclination = i;
    els.longPeri = lop;
    els.node = O;
    els.period = 2*Math.PI * Math.sqrt(a*a*a/GMm);
    els.time = t;
    
    return els;
};




/*
 * A simple leapfrog integrator. Only use for testing.
 */
Physics.leapfrog = function(tnew, ctx) {
    ctx.M = ctx.M || [1.];
    ctx.x = ctx.x || [0, 0, 0];
    ctx.v = ctx.v || [0, 0, 0];
    
    ctx.t = ctx.t || 0.;
    ctx.f = (ctx.f && ctx.f.length == ctx.x.length ? ctx.f  : _m.zeros(ctx.x.length));
    ctx.x1 = (ctx.x1 && ctx.x1.length == ctx.x.length ? ctx.x1  : _m.zeros(ctx.x.length));
    ctx.v1 = (ctx.v1 && ctx.v1.length == ctx.x.length ? ctx.v1  : _m.zeros(ctx.x.length));
    ctx.dt = ctx.dt || 1e-1;
    
    var t = ctx.t;
    var f = ctx.f;
    var x = ctx.x;
    var v = ctx.v;
    var x1 = ctx.x1;
    var v1 = ctx.v1;
    var M = ctx.M;
    var h = Units.RSUN;

    var N = x.length;
    

    var i, j;
    var step = 0;
    while (Math.abs(t - tnew) > 0) {
        var dt = Math.min(Math.abs(tnew-t), ctx.dt);

        t+=dt;
        for (i = 0; i < N; i+=NPHYS) {
            x1[i+X] = x[i+X] + 0.5 * v[i+X] * dt;
            x1[i+Y] = x[i+Y] + 0.5 * v[i+Y] * dt;
            x1[i+Z] = x[i+Z] + 0.5 * v[i+Z] * dt;
            f[i+X] = f[i+Y] = f[i+Z] = 0;
        }

        for (i = 0; i < N; i+= NPHYS)
            for (j = 0; j < i; j+= NPHYS) {
                var ii = i/NPHYS;
                var jj = j/NPHYS;
                
                var d = Math.sqrt((x1[i+X]-x1[j+X])*(x1[i+X]-x1[j+X]) + 
                                  (x1[i+Y]-x1[j+Y])*(x1[i+Y]-x1[j+Y]) +
                                  (x1[i+Z]-x1[j+Z])*(x1[i+Z]-x1[j+Z]));
                var d3 = d*d*d;
                var fx = -K2 * (x1[i+X] - x1[j+X])/d3;
                var fy = -K2 * (x1[i+Y] - x1[j+Y])/d3;
                var fz = -K2 * (x1[i+Z] - x1[j+Z])/d3;

                f[i+X] += fx * M[jj];
                f[j+X] -= fx * M[ii];
                
                f[i+Y] += fy * M[jj];
                f[j+Y] -= fy * M[ii];
                
                f[i+Z] += fz * M[jj];
                f[j+Z] -= fz * M[ii];
            }
        
        for (i = 0; i < N; i+= NPHYS) {
            x[i+X] += 0.5 * (2*v[i+X] + f[i+X] * dt) * dt;
            x[i+Y] += 0.5 * (2*v[i+Y] + f[i+Y] * dt) * dt;
            x[i+Z] += 0.5 * (2*v[i+Z] + f[i+Z] * dt) * dt;

            v[i+X] += f[i+X] * dt;
            v[i+Y] += f[i+Y] * dt;
            v[i+Z] += f[i+Z] * dt;
        }

        step++;
    }
   
    ctx.t = t;
};




if (typeof(exports) !== 'undefined')
    exports.Physics = Physics;

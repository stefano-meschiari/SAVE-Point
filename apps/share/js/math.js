"use strict";
if (typeof(exports) !== 'undefined')
    var fs = require('fs');

var _m = {};

_m.vectorize = function(f) {
    return function(v, vout) {
        if (typeof(v) !== "object")
            return f(+v);
        else if (!(v.length > 0 && typeof v[0] == "object")) {
            vout = vout || _m.zeros(v.length);
            for (var $i = 0, __v1 = (v), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) vout[$i] = f($1);
            return vout;
        } else {
            vout = vout || _m.zeros(v.length, v[0].length);
            for (var $j = 0; $j < vout.length; $j++) for (var $i = 0, __v1 = (v[$j]), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) vout[$j][$i] = f($1);
            return vout;
        }
    };
};

_m.sortFun = function(a, b) {
    return a-b;
};

_m.sort = function(v, f) {
    return Array.prototype.sort.call(v, f || _m.sortFun);
};


// Returns the minimum of the given vector (inline version: _min)
_m.min = function(v) {
    { if (!(v.length > 0 && typeof v[0] == "object")) { var min = v[0]; for (var $i = 0, __v1 = (v), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) min = Math.min(min, $1) } else { var min = v[0][0]; for (var $j = 0; $j < v.length; $j++) { for (var $i = 0, __v1 = (v[$j]), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) min = Math.min(min, $1); } } };
    return min;
};

// Returns the maximum of the given vector (inline version: _max)
_m.max = function(v) {
    { if (!(v.length > 0 && typeof v[0] == "object")) { var max = v[0]; for (var $i = 0, __v1 = (v), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) max = Math.max(max, $1) } else { var max = v[0][0]; for (var $j = 0; $j < v.length; $j++) { for (var $i = 0, __v1 = (v[$j]), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) max = Math.max(max, $1); } } };
    return max;
};

_m.which = function(v, f) {
    for (var i = 0; i < v.length; i++)
        if (f(v, i)) return i;
    return -1;
};

_m.whichMin = function(v) {
    var min = v[0], mini = 0;
    for (var i = 0; i < v.length; i++) {
        if (v[i] < min) {
            mini = i;
            min = v[i];
        }
    }
    return mini;
};

_m.whichMax = function(v) {
    var max = v[0], maxi = 0;
    for (var i = 0; i < v.length; i++) {
        if (v[i] > max) {
            maxi = i;
            max = v[i];
        }
    }
    return maxi;
};

_m.percentiles = function(v, perc, out, sorted) {
    out = out || _m.zeros(perc.length);
    sorted = (sorted === undefined ? false : sorted);
    if (!sorted)
        _m.sort(v);
    for (var i = 0; i < perc.length; i++) {
        out[i] = v[Math.round((perc[i]*(v.length-1)))];
    }
};

// Returns the dot product of two vectors (inline version: _dot)
_m.dot = function(v1, v2) {
    { var dot = 0.; for (var $i = 0; $i < v1.length; $i++) dot += v1[$i]*v2[$i]; };
    return dot;
};

// Returns the norm of the vector (inline version: _norm)
_m.norm = function(v) {
    { { var norm = 0.; for (var $i = 0; $i < v.length; $i++) norm += v[$i]*v[$i]; }; norm = Math.sqrt(norm); };
    return norm;
};

_m.log = function(v, fmt) {
    fmt = fmt || _m.defaultFormat;
    var i, j;
    var str = [];

    if (v === null)
        console.log(null);
    if (typeof(v) === 'number')
        console.log(fmt(v));
    else if (v.length == 0)
        console.log('[0]');
    else if (typeof(v[0]) === 'object') {
        for (i = 0; i < v.length; i++) {
            str.push('[' + i + ']');
            for (j = 0; j < v[0].length; j++)
                str.push('[' + j + '] ' + fmt(v[i][j]) + ' ');
            if (i != v.length-1)
                str.push('\n');
        }
        console.log(str.join(''));
    } else {

        for (j = 0; j < v.length; j++) {
            str.push('[' + j + '] ' + fmt(v[j]) + ' ');
        }
        console.log(str.join(''));
    }
};

// A seeded random number generator. Only use for testing!
_m.seededRandom = function(seed) {
    if (!(seed)) { throw new Error("Specify a seed.") };
    var m = Math.pow(2, 32);
    var a = 1664525;
    var c = 1013904223;
    var x = seed;
    return function() {
        x = (a*x+c)%m;
        return x/m;
    };
};

_m.uniformRandom = function(v, a, b, random) {
    a = a || 0;
    b = b || 1;
    v = v || _m.zeros(1);
    random = random || Math.random;

    for (var $i = 0, __length = v.length; $i < __length; $i++) v[$i] = a + (b-a) * random();

    return v;
};

_m.integerRandom = function(v, a, b, random) {
    a = a || 0;
    b = b || 10;
    v = v || _m.zeros(1);
    random = random || Math.random;
    for (var $i = 0, __length = v.length; $i < __length; $i++) v[$i] = Math.floor(random() * (b-a))+a;

    return v;
};


// Fills v with normally distributed random numbers with given mean and std. dev.
// (default = 0 and 1)
_m.gaussianRandom = function(v, mean, s, random) {
    random = random || Math.random;
    mean = mean || 0;
    s = s || 1;
    v = v || _m.zeros(1);

    for (var $i = 0, __length = v.length; $i < __length; $i++) v[$i] = mean + s*Math.sqrt(-2 * Math.log(random())) * Math.cos(2.*Math.PI * random());

    return v;
};

_m.sphereRandom = function(v, R, random) {
    v = v || _m.zeros(3);
    random = random || Math.random;
    _m.gaussianRandom(v, 0, 1, random);
    { { var norm = 0.; for (var $i = 0; $i < v.length; $i++) norm += v[$i]*v[$i]; }; norm = Math.sqrt(norm); };
    for (var $i = 0, __length = v.length; $i < __length; $i++) v[$i] *= R/norm;
    return v;
};

_m.rejectionSampling = function(v, f, g, xg, random) {
    v = v || _m.zeros(1);
    random = random || Math.random;

    var x, u, g_x;
    for (var i = 0; i < v.length; i++) {
        do {
            x = xg();
            u = random();
        } while (u < f(x)/g(x));
        v[i] = x;
    }
    return v;
};

_m.I = function(x) {
    return function() {
        return x;
    };
};

_m.nrow = function(m) {
    if (!(m.length > 0 && typeof m[0] == "object")) throw new Error('Input is not a matrix.');
    return m.length;
};

_m.ncol = function(m) {
    if (!(m.length > 0 && typeof m[0] == "object")) throw new Error('Input is not a matrix.');
    return m[0].length;
};

_m.rbind = function(a, b) {
    if (!(a.length > 0 && typeof a[0] == "object")) a = [a];
    if (!(b.length > 0 && typeof b[0] == "object")) b = [b];

    var i;
    var v = new Array(a.length + b.length);
    for (i = 0; i < a.length; i++)
        v[i] = a[i];
    for (i = 0; i < b.length; i++)
        v[i+a.length] = b[i];
    return v;
};

_m.cbind = function(a, b) {
    var isMatrix_a = (a.length > 0 && typeof a[0] == "object");
    var isMatrix_b = (b.length > 0 && typeof b[0] == "object");
    var j;
    var ret = new Array(a.length);
    var colsa = (isMatrix_a ? a[0].length : 1);
    var colsb = (isMatrix_b ? b[0].length : 1);

    for (var i = 0; i < ret.length; i++) {
        var v = new Array(colsa+colsb);
        for (j = 0; j < colsa; j++)
            v[j] = (isMatrix_a ? a[i][j] : a[i]);
        for (j = 0; j < colsb; j++)
            v[j+colsa] = (isMatrix_b ? b[i][j] : b[i]);
        ret[i] = v;
    }
    return ret;
};


_m.toArray = function(floatArray) {
    if (floatArray === null) return null;
    var ret = new Array(floatArray.length);

    if (floatArray.length > 0 && typeof(floatArray[0]) === 'object') {
        for (var j = 0; j < floatArray.length; j++)
            ret[j] = _m.toArray(floatArray[j]);
    } else {
        for (var $i = 0, __v1 = (floatArray), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) ret[$i] = $1;
    }
    return ret;
};

_m.toFloat64Array = function(array) {
    if (array === null) return null;

    var ret = new Float64Array(floatArray.length);
    for (var $i = 0, __v1 = (array), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) ret[$i] = $1;
    return ret;
};

_m.reverse = function(x) {
    var v = _m.zeros(x.length);
    for (var i = 0; i < x.length; i++)
        v[i] = x[x.length-i-1];
    return v;
};

_m.binaryFindValue = function(x, v) {
    if (x < v[0] || x > v[v.length-1])
        throw new Error(x + ' is outside the range: ' + v[0] + " " + v[v.length-1]);

    var a = 0;
    var b = v.length-1;
    if (v[0] > v[1]) {
        a = v.length-1;
        b = 0;
    }

    var fa = v[a];
    var fb = v[b];

    while (b - a > 1) {
        var t = (0.5 * (a+b))|0;
        var ft = v[t];

        if (ft < x) {
            a = t;
            fa = ft;
        } else if (ft > x) {
            b = t;
            fb = ft;
        } else
            return t;
    }
    return a;
};

_m.interpFun = function(x, y) {

    return function(xx) {
        if (xx < x[0] || xx > x[x.length-1])
            throw new Error(xx + " is outside the range: " + x[0] + " " + x[x.length-1]);
        var i = _m.binaryFindValue(xx, x);
        if (i == x.length-1) {
            if (xx == x[x.length-1])
                return y[y.length-1];
            else
                throw new Error('Outside range: ' + xx);
        }
        return (y[i])+((y[i+1])-(y[i]))*((xx)-(x[i]))/((x[i+1])-(x[i]));
    };
};

_m.derivFun = function(f, h) {
    h = h || 1e-3;

    return function(x) {
        return (f(x+0.5*h)-f(x-0.5*h))/h;
    };
};

_m.defaultFormat = function(n) {
    var v;
    if (n == null)
        v = typeof(n);
    else
        v = n.toExponential(5);
    return ('             ' + v).slice(-13);
};



_m.format = function(v, fmt) {
    fmt = fmt || _m.defaultFormat;

    var s = new Array(v.length);
    for (var i = 0; i < s.length; i++)
        s[i] = fmt(v[i]);
    return s;
};

_m.isNaN = function(v) {
    var nan = false;

    if (v.length > 0 && typeof(v[0]) == 'object') {
        for (var i = 0; i < v.length; i++)
            for (var j = 0; j < v[0].length; j++)
                nan |= isNaN(v[i][j]);
    } else {
        for (var $i = 0, __v1 = (v), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) nan |= isNaN($1);
    }
};

_m.writeVectorSync = function(file, v, fmt) {
    fmt = fmt || _m.defaultFormat;
    fs.writeFileSync(file, _m.format(v, fmt).join("\n"));
};

_m.writeMatrixSync = function(file, m, fmt) {
    fmt = fmt || _m.defaultFormat;
    var sm = [];
    for (var i = 0; i < m.length; i++)
        sm[i] = _m.format(m[i], fmt).join("\t");
    fs.writeFileSync(file, sm.join("\n"));
};

_m.zeros = function(N1, N2) {
    if (typeof(N2) === 'undefined' || N2 === 0) {
        var v1 = new Float64Array(N1);
        return(v1);
    } else {
        var v2 = new Array(N1);
        for (var i = 0; i < N1; i++)
            v2[i] = new Float64Array(N2);
        return v2;
    }
};

_m.seq = function(a, b, N) {
    var v = new Float64Array(N);
    for (var $i = 0, __length = v.length; $i < __length; $i++) v[$i] = a + (b-a)/(N-1) * $i;
    return(v);
};

_m.subset = function(v, a, b) {
    var r, i;

    if (typeof(a) == "function") {
        r = [];
        for (i = 0; i < v.length; i++)
            if (a(v[i], i))
                r.push(v[i]);
        return r;
    } else if (a > 0) {
        b = (b === undefined ? a + 1 : b);
        r = _m.zeros(b-a);
        for (i = a; i < b; i++)
            r[i-a] = v[i];
        return r;
    } else {
        a = -a;
        b = (b === undefined ? a + 1 : b);
        r = _m.zeros(v.length - (b-a));
        for (i = 0; i < a; i++)
            r[i] = v[i];
        for (i = b; i < v.length; i++)
            r[i-b+a] = v[i];

        return r;
    }
};

_m.trapzfun = function(x, f) {
    var q = 0;
    for (var i = 0; i < x.length-1; i++)
        q += (x[i+1]-x[i]) * (f(x[i+1])+f(x[i]));
    return 0.5*q;
};

_m.cumtrapzfun = function(x, f) {
    var q = _m.zeros(x.length-1);
    for (var i = 1; i < x.length-1; i++)
        q[i] = q[i-1] + 0.5*(x[i+1]-x[i]) * (f(x[i+1])+f(x[i]));
    return q;
};

_m.bisect = function(a, b, f, eps, ctx) {
    eps = eps || 1e-6 * Math.abs(a-b);

    var f_a = f(a, ctx);
    var f_b = f(b, ctx);

    if (f_a * f_b > 0)
        throw new Error('bisect: Function is not bracketed.');

    var x = 0.5 * (a+b);

    while (Math.abs(a-b) > eps) {
        var f_x = f(x, ctx);
        if (f_x*f_a > 0) {
            f_a = f_x;
            a = x;
        } else {
            f_b = f_x;
            b = x;
        }
        x = 0.5*(a+b);
    };

    return x;

};

_m.rk = function(t, y0, f, tout, ctx) {
    var isMatrix = (typeof(y0[0]) === 'object');

    var nrows = y0.length;

    ctx = ctx || {};
    f = f.bind(ctx);
    var ncols = (isMatrix ? y0[0].length : 0);

    ctx.f1 = ctx.f1 || _m.zeros(nrows, ncols);
    ctx.f2 = ctx.f2 || _m.zeros(nrows, ncols);
    ctx.f3 = ctx.f3 || _m.zeros(nrows, ncols);
    ctx.y1 = ctx.y1 || _m.zeros(nrows, ncols);
    ctx.D = ctx.D || _m.zeros(nrows, ncols);
    ctx.E = ctx.E || _m.zeros(nrows, ncols);

    ctx.dt = ctx.dt || (tout-t)*0.01;
    ctx.eps_abs = ctx.eps_abs || 1e-5;
    ctx.eps_rel = ctx.eps_rel || 1e-5;

    var dt_avg = 0;
    var steps = 0;

    var S = 0.99;
    var q = 2;

    var f1 = ctx.f1;
    var f2 = ctx.f2;
    var f3 = ctx.f3;
    var y1 = ctx.y1;
    var dt = ctx.dt;

    // Absolute and relative precision
    var eps_abs = ctx.eps_abs;
    var eps_rel = ctx.eps_rel;

    // Reuse arrays
    var a2 = y1;
    var D = ctx.D;
    var E = ctx.E;

    var i, j, err, dt_trial;

    var dt_new = dt;
    var direction = ((tout-t) >= 0 ? 1 : -1);
    var tscf = false;
    if (ctx.useTimeStep_control) {
        tscf = true;
    }

    while (Math.abs(t - tout) > 0) {
        dt_new = Math.min(Math.abs(dt), Math.abs(tout-t)) * direction;
        var repeat = true;

        do {
            if (!isMatrix) {
                for (i = 0; i < nrows; i++)
                    f1[i] = f2[i] = f3[i] = 0.;
            } else {
                for (i = 0; i < nrows; i++)
                    for (j = 0; j < ncols; j++) {
                        f1[i][j] = f2[i][j] = f3[i][j] = 0.;
                    }
            }
            dt = dt_new;

            f(t, y0, f1);
            if (tscf)
                var dt_control = ctx.timeStep_control;

            if (!isMatrix)
                for (var $i = 0, __v1 = (y0), __v2 = (f1), $1 = __v1[0], $2 = __v2[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i], $2 = __v2[$i]) y1[$i] = $1 + 0.5 * dt * $2;
            else
                for (i = 0; i < nrows; i++)
                    for (j = 0; j < ncols; j++)
                        y1[i][j] = y0[i][j] + 0.5 * dt * f1[i][j];

            f(t + 0.5*dt, y1, f2);

            if (!isMatrix)
                for (var $i = 0, __v1 = (y0), __v2 = (f1), __v3 = (f2), $1 = __v1[0], $2 = __v2[0], $3 = __v3[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i], $2 = __v2[$i], $3 = __v3[$i]) y1[$i] = $1 + dt * (-$2+2*$3);
            else
                for (i = 0; i < nrows; i++)
                    for (j = 0; j < ncols; j++)
                        y1[i][j] = y0[i][j] + dt * (-f1[i][j]+2.*f2[i][j]);

            f(t + dt, y1, f3);

            if (!isMatrix) {
                for (var $i = 0, __v1 = (y0), __v2 = (f1), __v3 = (f2), __v4 = (f3), $1 = __v1[0], $2 = __v2[0], $3 = __v3[0], $4 = __v4[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i], $2 = __v2[$i], $3 = __v3[$i], $4 = __v4[$i]) a2[$i] = $1 + dt/6. * ($2+4.*$3+$4);
                for (var $i = 0, __v1 = (y0), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) D[$i] = eps_abs + eps_rel * Math.abs($1);
                for (var $i = 0, __v1 = (f1), __v2 = (f2), __v3 = (f3), $1 = __v1[0], $2 = __v2[0], $3 = __v3[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i], $2 = __v2[$i], $3 = __v3[$i]) E[$i] = Math.abs(dt*($2 - ($1+4.*$2+$3)/6.));
            } else {
                for (i = 0; i < nrows; i++)
                    for (j = 0; j < ncols; j++) {
                        var y0ij = y0[i][j];
                        a2[i][j] = y0ij + dt/6. * (f1[i][j] + 4.*f2[i][j] + f3[i][j]);
                        D[i][j] = eps_abs + eps_rel * Math.abs(y0ij);
                        E[i][j] = Math.abs(dt*(f2[i][j] - (f1[i][j] + 4.*f2[i][j] + f3[i][j])/6));
                    }
            }

            err = -1e20;
            if (!isMatrix)
                for (var $i = 0, __v1 = (E), __v2 = (D), $1 = __v1[0], $2 = __v2[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i], $2 = __v2[$i]) err = Math.max(err, ($1-$2)/$2);
            else
                for (i = 0; i < nrows; i++)
                    for (j = 0; j < ncols; j++) {
                        var diff = (E[i][j]-D[i][j])/D[i][j];
                        err = Math.max(err, diff);
                    }

            if (err > 0.1) {
                err = 0;
                if (!isMatrix) {
                    for (var $i = 0, __v1 = (E), __v2 = (D), $1 = __v1[0], $2 = __v2[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i], $2 = __v2[$i]) E[$i] = Math.abs($1/$2);
                    { if (!(E.length > 0 && typeof E[0] == "object")) { var err = E[0]; for (var $i = 0, __v1 = (E), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) err = Math.max(err, $1) } else { var err = E[0][0]; for (var $j = 0; $j < E.length; $j++) { for (var $i = 0, __v1 = (E[$j]), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) err = Math.max(err, $1); } } };
                } else {
                    for (i = 0; i < nrows; i++)
                        for (j = 0; j < ncols; j++)
                            err = Math.max(err, E[i][j]/D[i][j]);
                }
                dt_trial = dt * S * Math.pow(err, -1./q);
            } else if (err <= 0.) {
                err = 0.;
                if (!isMatrix) {
                    for (var $i = 0, __v1 = (E), __v2 = (D), $1 = __v1[0], $2 = __v2[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i], $2 = __v2[$i]) E[$i] = $1/$2;
                    { if (!(E.length > 0 && typeof E[0] == "object")) { var err = E[0]; for (var $i = 0, __v1 = (E), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) err = Math.max(err, $1) } else { var err = E[0][0]; for (var $j = 0; $j < E.length; $j++) { for (var $i = 0, __v1 = (E[$j]), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) err = Math.max(err, $1); } } };
                } else {
                    for (i = 0; i < nrows; i++)
                        for (j = 0; j < ncols; j++)
                            err = Math.max(err, E[i][j]/D[i][j]);
                }
                dt_trial = dt * S * Math.pow(err, -1./(q+1));
                repeat = false;
            } else {
                dt_trial = dt;
                repeat = false;
            }

            if (tscf) {
                dt_trial = Math.min(Math.abs(dt_trial), Math.abs(dt_control)) * direction;
            }
            if (Math.abs(dt_trial) > 5.*Math.abs(dt))
                dt_trial = 5.*dt;
            else if (Math.abs(dt_trial) < 0.2 * Math.abs(dt))
                dt_trial = 0.2*dt;

            dt_new = Math.min(Math.abs(dt_trial), Math.abs(tout-t)) * direction;

            if (!(((dt_new) >= 0 ? 1 : -1) == direction)) { throw new Error("Sign of dt different from sign of direction", direction) };

            if (isNaN(dt_new)) {
                throw new Error('dt_new is NaN. ' + dt_trial + " " + dt + " " + err + " " + (tout-t));
            } else if (_m.isNaN(a2))
                throw new Error('a2 is NaN.');

        } while (repeat);

        t += dt;
        dt_avg += dt;
        steps++;
        dt = dt_new;

        if (!isMatrix)
            for (var $i = 0, __v1 = (a2), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) y0[$i] = $1;
        else
            for (var $j = 0; $j < y0.length; $j++) for (var $i = 0, __v1 = (a2[$j]), $1 = __v1[0], __length = __v1.length; $i < __length; $i++, $1 = __v1[$i]) y0[$j][$i] = $1;
    };

    ctx.dt = dt;
    ctx.dt_avg = dt_avg/steps;

    return y0;
};


if (typeof(exports) !== 'undefined')
    exports._m = _m;




// Local Variables:
// eval: (add-hook 'after-save-hook (lambda() (shell-command "cd ..; make >/dev/null" nil)) nil t)
// End:

// **************************** cubic-bezier ****************************

/**
 * Cubic-Bezier
 * @description
 * http://cubic-bezier.com
 * http://www.roblaplaca.com/examples/bezierBuilder/
 * https://gist.github.com/996893
 * http://www.netzgesta.de/dev/cubic-bezier-timing-function.html
 * http://trac.webkit.org/browser/trunk/Source/WebCore/platform/graphics/UnitBezier.h
 * @param {Number} p1x
 * @param {Number} p1y
 * @param {Number} p2x
 * @param {Number} p2y
 * @constructor
 */
CubicBezier = function (p1x, p1y, p2x, p2y) {
    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    this.cx = 3.0 * p1x;
    this.bx = 3.0 * (p2x - p1x) - this.cx;
    this.ax = 1.0 - this.cx - this.bx;

    this.cy = 3.0 * p1y;
    this.by = 3.0 * (p2y - p1y) - this.cy;
    this.ay = 1.0 - this.cy - this.by;
};
CubicBezier.prototype = {
    constructor: CubicBezier,
    sampleCurveX: function (t) {
        // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
        return ((this.ax * t + this.bx) * t + this.cx) * t;
    },
    sampleCurveY: function (t) {
        return ((this.ay * t + this.by) * t + this.cy) * t;
    },
    sampleCurveDerivativeX: function (t) {
        return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
    },
    sampleCurveDerivativeY: function (t) {
        return (3.0 * this.ay * t + 2.0 * this.by) * t + this.cy;
    },
    /**
     * Given an x value, find a parametric value it came from.
     * @param {Number} x
     * @param {Number} epsilon
     * @return {Number}
     */
    solveCurveX: function (x, epsilon) {
        var t0, t1, t2, x2, d2, i;

        function fabs (n) {
            return n < 0 ? -n : n;
        }

        // First try a few iterations of Newton's method -- normally very fast.
        for (t2 = x, i = 0; i < 8; i++) {
            x2 = this.sampleCurveX(t2) - x;
            if (fabs(x2) < epsilon)
                return t2;
            d2 = this.sampleCurveDerivativeX(t2);
            if (fabs(d2) < 1e-6)
                break;
            t2 = t2 - x2 / d2;
        }

        // Fall back to the bisection method for reliability.
        t0 = 0.0;
        t1 = 1.0;
        t2 = x;

        if (t2 < t0)
            return t0;
        if (t2 > t1)
            return t1;

        while (t0 < t1) {
            x2 = this.sampleCurveX(t2);
            if (fabs(x2 - x) < epsilon)
                return t2;
            if (x > x2)
                t0 = t2;
            else
                t1 = t2;
            t2 = (t1 - t0) * .5 + t0;
        }

        // Failure.
        return t2;
    },
    solveCurveY: function (x, epsilon) {
        var t0, t1, t2, x2, d2, i;

        function fabs (n) {
            return n < 0 ? -n : n;
        }

        // First try a few iterations of Newton's method -- normally very fast.
        for (t2 = x, i = 0; i < 8; i++) {
            x2 = this.sampleCurveY(t2) - x;
            if (fabs(x2) < epsilon)
                return t2;
            d2 = this.sampleCurveDerivativeY(t2);
            if (fabs(d2) < 1e-6)
                break;
            t2 = t2 - x2 / d2;
        }

        // Fall back to the bisection method for reliability.
        t0 = 0.0;
        t1 = 1.0;
        t2 = x;

        if (t2 < t0)
            return t0;
        if (t2 > t1)
            return t1;

        while (t0 < t1) {
            x2 = this.sampleCurveY(t2);
            if (fabs(x2 - x) < epsilon)
                return t2;
            if (x > x2)
                t0 = t2;
            else
                t1 = t2;
            t2 = (t1 - t0) * .5 + t0;
        }

        // Failure.
        return t2;
    },
    /**
     * solve y by x
     * @param {Number} x
     * @param {Number} epsilon
     * @return {Number}
     */
    solve: function (x, epsilon) {
        return this.sampleCurveY(this.solveCurveX(x, epsilon));
    },
    solveX: function (y, epsilon) {
        return this.sampleCurveX(this.solveCurveY(y, epsilon));
    },
    /**
     * The epsilon value to pass given that the animation is going to run over |dur| seconds. The longer the
     * animation, the more precision is needed in the timing function result to avoid ugly discontinuities.
     * @param {Number} duration in seconds
     */
    solveEpsilon: function (duration) {
        return 1 / (200 * duration);
    }
};


/**
 * MicroEvent
 * - to make any js object an event emitter
 */
MicroEvent = {
    subscribe:function (event, fct) {
        this._events = this._events || {};
        this._events[event] = this._events[event] || [];
        this._events[event].push(fct);
        return this;
    },
    unsubscribe:function (event, fct) {
        this._events = this._events || {};

        if (event in this._events !== false) {
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        }

        return this;
    },
    publish:function (event /*, args... */) {
        this._events = this._events || {};

        if (event in this._events !== false) {
            for (var i = 0; i < this._events[event].length; i++) {
                try {
                    this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
                }
                catch (e) {
                    console.error(arguments, e.arguments, e.stack);
                }
            }
        }

        return this;
    },
    /**
     * mixin will delegate all MicroEvent.js function in the destination object
     * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
     * @param {Object} destObject the object which will support MicroEvent
     */
    mixin:function (destObject) {
        var props = ['subscribe', 'unsubscribe', 'publish'];
        for (var i = 0; i < props.length; i++) {
            destObject[props[i]] = MicroEvent[props[i]];
        }
    }
};
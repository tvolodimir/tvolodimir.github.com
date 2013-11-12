defineModule('TWEEN', [], function (module, $r) {

    /**
     * @overview TWEEN module.
     */

    "use strict";

    /**
     * @author https://github.com/sole/tween.js
     */

    var TWEEN = (function () {

        var i, tl, interval, time, fps = 60, autostart = false, tweens = [], num_tweens;

        return {
            setFPS: function (f) {
                fps = f || 60;
            },
            start: function (f) {
                if (arguments.length != 0) {
                    this.setFPS(f);
                }
                interval = setInterval(this.update, 1000 / fps);
            },
            stop: function () {
                clearInterval(interval);
            },
            setAutostart: function (value) {
                autostart = value;
                if (autostart && !interval) {
                    this.start();
                }
            },
            add: function (tween) {
                if (tweens.indexOf(tween) == -1)
                    tweens.push(tween);
                if (autostart && !interval) {
                    this.start();
                }
            },
            getAll: function () {
                return tweens;
            },
            removeAll: function () {
                tweens = [];
            },
            remove: function (tween) {
                i = tweens.indexOf(tween);
                if (i !== -1) {
                    tweens.splice(i, 1);
                }
            },
            update: function (_time) {
                i = 0;
                num_tweens = tweens.length;
                var time = _time || Date.now();

                while (i < num_tweens) {
                    if (tweens[ i ].update(time)) {
                        i++;
                    } else {
                        tweens.splice(i, 1);
                        num_tweens--;
                    }
                }
                if (num_tweens == 0 && autostart) {
                    this.stop();
                }
            }
        };
    })();

    TWEEN.Tween = function (object) {
        this._object = object;
        this._valuesStart = {};
        this._valuesDelta = {};
        this._valuesEnd = {};
        this._duration = 1000;
        this._delayTime = 0;
        this._done = false;
        this._startTime = null;
        this._easingFunction = TWEEN.Easing.Linear.EaseNone;
        this._chainedTween = null;
        this._onUpdateCallback = null;
        this._onCompleteCallback = null;
    };
    TWEEN.Tween.prototype = {
        to: function (properties, duration) {
            if (duration !== null) {
                this._duration = duration;
            }

            for (var property in properties) {
                // This prevents the engine from interpolating null values
                if (this._object[ property ] === null) {
                    continue;
                }
                // The current values are read when the tween starts;
                // here we only store the final desired values
                this._valuesEnd[ property ] = properties[ property ];
            }

            return this;
        },
        start: function (_time) {
            TWEEN.add(this);

            this._done = false;
            this._startTime = _time ? _time + this._delayTime : Date.now() + this._delayTime;

            for (var property in this._valuesEnd) {
                // Again, prevent dealing with null values
                if (this._object[ property ] === null) {
                    continue;
                }
                this._valuesStart[ property ] = this._object[ property ];
                this._valuesDelta[ property ] = this._valuesEnd[ property ] - this._object[ property ];
            }
            return this;
        },
        stop: function () {
            TWEEN.remove(this);
            return this;
        },
        delay: function (amount) {
            this._delayTime = amount;
            return this;
        },
        easing: function (easing) {
            this._easingFunction = easing;
            return this;
        },
        chain: function (chainedTween) {
            this._chainedTween = chainedTween;
            return this;
        },
        onUpdate: function (onUpdateCallback) {
            this._onUpdateCallback = onUpdateCallback;
            return this;
        },
        onComplete: function (onCompleteCallback) {
            this._onCompleteCallback = onCompleteCallback;
            return this;
        },
        update: function (time) {
            var property, elapsed, value;

            if (time < this._startTime) {
                return true;
            }

            elapsed = ( time - this._startTime ) / this._duration;
            elapsed = elapsed > 1 ? 1 : elapsed;

            value = this._easingFunction(elapsed);

            for (property in this._valuesDelta) {
                this._object[ property ] = this._valuesStart[ property ] + this._valuesDelta[ property ] * value;
            }

            if (this._onUpdateCallback !== null) {
                this._onUpdateCallback.call(this._object, value);
            }

            if (elapsed == 1) {
                if (this._onCompleteCallback !== null) {
                    this._onCompleteCallback.call(this._object);
                }
                if (this._chainedTween !== null) {
                    this._chainedTween.start();
                }
                this._done = true;
                return false;
            }
            return true;
        }
    };

    TWEEN.Easing = { Linear: {}, Quadratic: {}, Cubic: {}, Quartic: {}, Quintic: {}, Sinusoidal: {}, Exponential: {}, Circular: {}, Elastic: {}, Back: {}, Bounce: {} };

    TWEEN.Easing.Linear.EaseNone = function (k) {
        return k;
    };
//
    TWEEN.Easing.Quadratic.EaseIn = function (k) {
        return k * k;
    };
    TWEEN.Easing.Quadratic.EaseOut = function (k) {
        return -k * ( k - 2 );
    };
    TWEEN.Easing.Quadratic.EaseInOut = function (k) {
        if (( k *= 2 ) < 1) return 0.5 * k * k;
        return -0.5 * ( --k * ( k - 2 ) - 1 );
    };
//
    TWEEN.Easing.Cubic.EaseIn = function (k) {
        return k * k * k;
    };
    TWEEN.Easing.Cubic.EaseOut = function (k) {
        return --k * k * k + 1;
    };
    TWEEN.Easing.Cubic.EaseInOut = function (k) {
        if (( k *= 2 ) < 1) return 0.5 * k * k * k;
        return 0.5 * ( ( k -= 2 ) * k * k + 2 );
    };
//
    TWEEN.Easing.Quartic.EaseIn = function (k) {
        return k * k * k * k;
    };
    TWEEN.Easing.Quartic.EaseOut = function (k) {
        return -( --k * k * k * k - 1 );
    };
    TWEEN.Easing.Quartic.EaseInOut = function (k) {
        if (( k *= 2 ) < 1) return 0.5 * k * k * k * k;
        return -0.5 * ( ( k -= 2 ) * k * k * k - 2 );
    };
//
    TWEEN.Easing.Quintic.EaseIn = function (k) {
        return k * k * k * k * k;
    };
    TWEEN.Easing.Quintic.EaseOut = function (k) {
        return ( k = k - 1 ) * k * k * k * k + 1;
    };
    TWEEN.Easing.Quintic.EaseInOut = function (k) {
        if (( k *= 2 ) < 1) return 0.5 * k * k * k * k * k;
        return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );
    };
//
    TWEEN.Easing.Sinusoidal.EaseIn = function (k) {
        return -Math.cos(k * Math.PI / 2) + 1;
    };
    TWEEN.Easing.Sinusoidal.EaseOut = function (k) {
        return Math.sin(k * Math.PI / 2);
    };
    TWEEN.Easing.Sinusoidal.EaseInOut = function (k) {
        return -0.5 * ( Math.cos(Math.PI * k) - 1 );
    };
//
    TWEEN.Easing.Exponential.EaseIn = function (k) {
        return k == 0 ? 0 : Math.pow(2, 10 * ( k - 1 ));
    };
    TWEEN.Easing.Exponential.EaseOut = function (k) {
        return k == 1 ? 1 : -Math.pow(2, -10 * k) + 1;
    };
    TWEEN.Easing.Exponential.EaseInOut = function (k) {
        if (k == 0) return 0;
        if (k == 1) return 1;
        if (( k *= 2 ) < 1) return 0.5 * Math.pow(2, 10 * ( k - 1 ));
        return 0.5 * ( -Math.pow(2, -10 * ( k - 1 )) + 2 );
    };
//
    TWEEN.Easing.Circular.EaseIn = function (k) {
        return -( Math.sqrt(1 - k * k) - 1);
    };
    TWEEN.Easing.Circular.EaseOut = function (k) {
        return Math.sqrt(1 - --k * k);
    };
    TWEEN.Easing.Circular.EaseInOut = function (k) {
        if (( k /= 0.5 ) < 1) return -0.5 * ( Math.sqrt(1 - k * k) - 1);
        return 0.5 * ( Math.sqrt(1 - ( k -= 2) * k) + 1);
    };
//
    TWEEN.Easing.Elastic.EaseIn = function (k) {
        var s, a = 0.1, p = 0.4;
        if (k == 0) return 0;
        if (k == 1) return 1;
        if (!p) p = 0.3;
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        }
        else s = p / ( 2 * Math.PI ) * Math.asin(1 / a);
        return -( a * Math.pow(2, 10 * ( k -= 1 )) * Math.sin(( k - s ) * ( 2 * Math.PI ) / p) );
    };
    TWEEN.Easing.Elastic.EaseOut = function (k) {
        var s, a = 0.1, p = 0.4;
        if (k == 0) return 0;
        if (k == 1) return 1;
        if (!p) p = 0.3;
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        }
        else s = p / ( 2 * Math.PI ) * Math.asin(1 / a);
        return ( a * Math.pow(2, -10 * k) * Math.sin(( k - s ) * ( 2 * Math.PI ) / p) + 1 );
    };
    TWEEN.Easing.Elastic.EaseInOut = function (k) {
        var s, a = 0.1, p = 0.4;
        if (k == 0) return 0;
        if (k == 1) return 1;
        if (!p) p = 0.3;
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        }
        else s = p / ( 2 * Math.PI ) * Math.asin(1 / a);
        if (( k *= 2 ) < 1) return -0.5 * ( a * Math.pow(2, 10 * ( k -= 1 )) * Math.sin(( k - s ) * ( 2 * Math.PI ) / p) );
        return a * Math.pow(2, -10 * ( k -= 1 )) * Math.sin(( k - s ) * ( 2 * Math.PI ) / p) * 0.5 + 1;
    };
//
    TWEEN.Easing.Back.EaseIn = function (k) {
        var s = 1.70158;
        return k * k * ( ( s + 1 ) * k - s );
    };
    TWEEN.Easing.Back.EaseOut = function (k) {
        var s = 1.70158;
        return ( k = k - 1 ) * k * ( ( s + 1 ) * k + s ) + 1;
    };
    TWEEN.Easing.Back.EaseInOut = function (k) {
        var s = 1.70158 * 1.525;
        if (( k *= 2 ) < 1) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
        return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
    };
//
    TWEEN.Easing.Bounce.EaseIn = function (k) {
        return 1 - TWEEN.Easing.Bounce.EaseOut(1 - k);
    };
    TWEEN.Easing.Bounce.EaseOut = function (k) {
        if (( k /= 1 ) < ( 1 / 2.75 )) {
            return 7.5625 * k * k;
        } else if (k < ( 2 / 2.75 )) {
            return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
        } else if (k < ( 2.5 / 2.75 )) {
            return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
        } else {
            return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
        }
    };
    TWEEN.Easing.Bounce.EaseInOut = function (k) {
        if (k < 0.5) return TWEEN.Easing.Bounce.EaseIn(k * 2) * 0.5;
        return TWEEN.Easing.Bounce.EaseOut(k * 2 - 1) * 0.5 + 0.5;
    };


    module.TWEEN = TWEEN;
}, module.exports);
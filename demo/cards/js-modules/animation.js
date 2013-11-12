defineModule('animation', [], function (module) {
    /**
     * @overview Animation module.
     * @author tvolodimir@gmail.com
     */

    'use strict';

    var TimeEmitter = {
        _intervalId: 0,
        _subscribers: [],
        _handler: function () {
            var now = Date.now();
            for (var i = 0; i < TimeEmitter._subscribers.length; i++) {
                try {
                    TimeEmitter._subscribers[i](now);
                }
                catch (e) {
                    console.error('[TimeEmitter]', e['arguments'], e['stack']);
                }
            }
        },
        begin: function () {
            TimeEmitter._intervalId = setInterval(TimeEmitter._handler, 20);
        },
        stop: function () {
            clearInterval(TimeEmitter._intervalId);
        },
        subscribe: function (receiver) {
            TimeEmitter._subscribers.push(receiver);
        },
        unsubscribe: function (receiver) {
            var i = TimeEmitter._subscribers.indexOf(receiver);
            if (i < 0) {
                throw new Error('[TimeEmitter] not found receiver to unsubscribe');
            }
            TimeEmitter._subscribers.splice(i, 1);
        }
    };
    TimeEmitter.begin();

    /**
     * Emitter
     * @constructor
     * @class Emitter
     */
    var Emitter = function () {
        this._isEnabled = false;
        this._ch = ChainHandler.empty;

        var that = this;
        /**
         * handler
         * @param {Date} now
         * @private
         */
        this.__handler = function (now) {
            that._handler(now);
        };
    };
    Emitter.prototype = {
        constructor: Emitter,

        /**
         * start
         * @return {Emitter}
         */
        start: function () {
            if (this._isEnabled === true) return this;
            this._isEnabled = true;
            TimeEmitter.subscribe(this.__handler);
            return this;
        },
        /**
         * stop
         * @return {Emitter}
         */
        stop: function () {
            if (this._isEnabled === false) return this;
            this._isEnabled = false;
            TimeEmitter.unsubscribe(this.__handler);
            return this;
        },

        join: function (ch) {
            this._ch = ch;
            return ch;
        },

        _handler: function (now) {
            if (this._isEnabled === false) return;

            try {
                this._ch.next(now);
            }
            catch (e) {
                console.error('[Emitter]', e['arguments'], e['stack']);
            }
        }
    };

    var ChainHandler = function (tr) {
        this._ch = ChainHandler.empty;
        this.join = function (ch) {
            this._ch = ch;
            return ch;
        };
        this.next = function (o) {
            o = tr(o);
            this._ch.next(o);
        }
    };
    ChainHandler.empty = {
        next: function (o) {
        }
    };
    ChainHandler.log = {
        next: function (o) {
            console.log(o);
        }
    };

    /**
     * Waiter
     * @param {int} duration
     * @constructor
     * @extends ChainHandler
     */
    var Waiter = function (duration) {
        /**
         * duration in milliseconds
         * @type {int}
         * @private
         */
        this._d = duration;
        /**
         * first time handled
         * @type {int}
         * @private
         */
        this._ft = 0;

        this._ch = ChainHandler.empty;
    };
    Waiter.prototype = {
        constructor: Waiter,

        start: function () {
            this._ft = Date.now();
        },

        join: function (ch) {
            this._ch = ch;
            return ch;
        },
        /**
         * @param {Date} o
         */
        next: function (o) {
            var a = this._ft;
            if (a === 0) {
                this._ft = o;
                a = o;
            }

            if (o - a - this._d >= 0) {
                this._ch.next(o);
            }
        }
    };

    /**
     * LocalTimeEmitter
     * @param {int} offset
     * @param {int} duration
     * @constructor
     * @class LocalTimeEmitter
     * @extends ChainHandler
     */
    var LocalTimeEmitter = function (offset, duration) {
        /**
         * emitter
         * @type {Emitter}
         * @private
         */
        this._e = new Emitter();
        /**
         * offset duration
         * @type {int}
         * @private
         */
        this._of = offset;
        /**
         * interval duration
         * @type {int}
         * @private
         */
        this._d = duration;
        /**
         * is started
         * @type {boolean}
         */
        this.isStarted = false;
        /**
         * is paused
         * @type {boolean}
         * @private
         */
        this._paused = false;
        /**
         * paused duration
         * @type {int}
         * @private
         */
        this._pausedDuration = 0;
        /**
         * last paused time
         * @type {Number}
         * @private
         */
        this._lastpausedTimme = null;

        this._onStop = function () {
        };
        this._onPause = function () {
        };
        this._onResume = function () {
        };

        this._ch = ChainHandler.empty;

        this._e.join(this);
        /**
         * start time
         * @type {int}
         * @private
         */
        this._t0 = 0;
    };
    LocalTimeEmitter.prototype = {
        constructor: LocalTimeEmitter,
        start: function () {
            if (this.isStarted === true) return;
            this.isStarted = true;
            this._t0 = Date.now() + this._of;
            this._e.start();
        },
        pause: function () {
            if (this.isStarted === false) return;
            if (this._paused === true) return;
            this._lastpausedTimme = Date.now();
            this._paused = true;
            this._onPause();
        },
        resume: function () {
            if (this.isStarted === false) return;
            if (this._paused === false) return;
            this._pausedDuration += (Date.now() - this._lastpausedTimme);
            this._paused = false;
            this._onResume();
        },
        stop: function () {
            if (this.isStarted === false) return;
            this.isStarted = false;
            this._e.stop();
            this._onStop();
        },
        join: function (ch) {
            this._ch = ch;
            return ch;
        },
        next: function (o) {
            if (this._paused === true) {
                return;
            }
            var lt = o - this._t0 - this._pausedDuration;
            if (lt >= 0) {
                if (lt >= this._d) {
                    this.stop();
                }
                this._ch.next(lt);
            }
        },
        onStop: function (cb) {
            this._onStop = cb;
        },
        onPause: function (cb) {
            this._onPause = cb;
        },
        onResume: function (cb) {
            this._onResume = cb;
        }
    };

    /**
     * Throttle
     * @param {int} interval
     * @constructor
     * @class Throttle
     * @extends ChainHandler
     */
    var Throttle = function (interval) {
        this._ch = ChainHandler.empty;

        this.interval = interval;

        this.lastused = null;
    };
    Throttle.prototype = {
        constructor: Throttle,

        join: function (ch) {
            this._ch = ch;
            return ch;
        },
        next: function (o) {
            if ((this.lastused === null) || (Date.now() - this.lastused > this.interval)) {
                this.lastused = Date.now();
                this._ch.next(o);
            }
        }
    };

    /**
     * Once
     * @param {function} cb
     * @constructor
     * @class Once
     * @extends ChainHandler
     */
    var Once = function (cb) {
        this._e = true;
        this.next = function (o) {
            if (this._e === true) {
                this._e = false;
                if (cb !== null && cb !== undefined) {
                    cb(o);
                }
            }
        }
    };


    /**
     * chain same action with each element in array
     * @param {Array} items
     * @param {function} action
     * @param {function} cb
     */
    var queueAction = function (items, action, cb) {
        var i = 0;
        var next = function next() {
            var j = i++;
            if (j < items.length) {
                action(items[j], next);
            }
            else {
                cb();
            }
        };
        next();
    };

    var animate = function (target, name, offset, duration, cb) {
        var anima = target[name];
        if (anima) {
            anima.stop();
            target[name] = null;
        }
        var a = new LocalTimeEmitter(offset, duration);
        a.join({next: function (lt) {
            if (lt >= duration) {
                target[name] = null;
            }
            cb(lt, target);
        }});

        target[name] = a;

        a.start();
    };

    var animate2 = function (target, name, offset, duration, start_cb, end_cb, update_cb, onStop) {
        var anima = target[name];
        if (anima) {
            anima.stop();
            target[name] = null;
        }
        var beginEmitter = new Once(start_cb);
        var a = new LocalTimeEmitter(offset, duration);
        if (onStop !== undefined && onStop !== null) {
            a.onStop(onStop);
        }
        a.join({next: function (lt) {
            beginEmitter.next(lt);
            if (lt >= duration) {
                target[name] = null;
            }
            if (update_cb !== undefined && update_cb !== null) {
                update_cb(lt);
            }
            if (lt >= duration) {
                if (end_cb !== undefined && end_cb !== null) {
                    end_cb(lt);
                }
            }
        }});

        target[name] = a;

        a.start();
    };

    var timeoutsAnimateArray = function (name, timeouts, items, duration, update_cb, finishedAll_cb) {
        var allDone = 0;
        var checkDone = false;

        for (var j = 0; j < timeouts.length; j++) {
            var item = items[j];

            allDone++;

            if (j == timeouts.length - 1) {
                checkDone = true;
            }

            item.animationState = 0;

            animate(item, name, timeouts[j], duration, function (lt, target) {
                var t = Math.min(lt, duration) / duration;
                update_cb(target, t);
                if (lt >= duration) {
                    allDone--;
                    if (checkDone === true && allDone === 0) {
                        finishedAll_cb();
                    }
                }
            });
        }
    };

    var queueAnimateArray = function (name, items, offset, duration, update_cb, finishedLast_cb) {

        var shuffledItems = [];
        for (var j = 0; j < items.length; j++) {
            shuffledItems[j] = items[j];
        }
        shuffledItems.sort(function () {
            return 0.5 - Math.random()
        });

        queueAction(
            shuffledItems,
            function (item, next) {
                item.animationState = 1;
                animate(item, name, offset, duration, function (lt) {
                    var t = Math.min(lt, duration) / duration;
                    update_cb(item, t);
                    if (lt >= duration) {
                        next();
                    }
                });
            },
            finishedLast_cb
        );
    };

    /**
     * get random integer by range
     * @param {int} min
     * @param {int} max
     * @returns {int}
     */
    var getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * generate Random SubArray
     * @param {int} arrayLength
     * @param {int} subArrayLength
     * @returns {int[]}
     */
    var generateRandomSubArray = function (arrayLength, subArrayLength) {
        var used = [];

        for (var k = 0; k < subArrayLength; k++) {

            var index = getRandomInt(0, arrayLength - k - 1);
            for (var i = 0; i < used.length; i++) {
                if (used[i] === index) {
                    index++;
                }
            }
            used.push(index);
            used.sort(function (a, b) {
                return a - b;
            });
        }

        return used;
    };

    module.TimeEmitter = TimeEmitter;
    module.Emitter = Emitter;
    module.ChainHandler = ChainHandler;
    module.Waiter = Waiter;
    module.LocalTimeEmitter = LocalTimeEmitter;
    module.Throttle = Throttle;
    module.Once = Once;

    module.queueAction = queueAction;
    module.animate = animate;
    module.animate2 = animate2;

    module.generateRandomSubArray = generateRandomSubArray;
});
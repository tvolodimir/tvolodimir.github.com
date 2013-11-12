(function (scope) {
    'use strict';
/**
 *  @overview $simpleModuleManager like RequireJS but more simple:)
 *  - get loaded module by module's name
 *  - load module :
 *       - only once invoke factory of each modules
 *       - check if requires modules already loaded
 **/
if (typeof scope.$simpleModuleManager === 'undefined') {

    var module = {};
    module.loaded = {};
    module.getModule = function (name) {
        return module.loaded[name];
    };
    module.invoke = function (name, requires, factory) {
        if (module.loaded[name]) {
            console.log('[mm] module ' + name + ' already loaded');
            return false;
        }
        var r = [];
        for (var i = 0; i < requires.length; i++) {
            var m = module.loaded[requires[i]];
            if (!m) {
                throw new Error('module ' + name + ' require ' + requires[i]);
            }
            else {
                r.push(m);
            }
        }

        r.unshift(module.loaded[name] = {}, module.getModule);

        (function () {
            console.log('[mm] loading ' + name);
            try {
                factory.apply(this, r);
            }
            catch (error) {
                console.error('[mm]', error['arguments'], error['stack']);
            }
        })();

        return true;
    };

    scope.$simpleModuleManager = {
        invoke: module.invoke,
        getModule: module.getModule
    };
}
var defineModule = scope.$simpleModuleManager.invoke;
defineModule('jsshiv', [], function (module) {
    /**
     *  @overview jsShiv
     **/

    "use strict";

    var global =  ('undefined' === typeof window) ? GLOBAL : window;

    (function (global) {
        var global_isFinite = global.isFinite;

        Object.defineProperty(Number, 'isFinite', {
            value: function isFinite(value) {
                return typeof value === 'number' && global_isFinite(value);
            },
            configurable: true,
            enumerable: false,
            writable: true
        });
    })(global);

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elem) {
            for (var i = 0, length = this.length; i < length; ++i) {
                if (this[i] === elem) {
                    return i;
                }
            }
            return -1;
        };
    }

    if (!Function.prototype.bind) {
        Function.prototype.bind = function (obj) {
            var fn = this;
            return function () {
                return fn.apply(obj, arguments);
            };
        };
    }

    if (!Date.now) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }

    if ('undefined' !== typeof HTMLElement) {
        if (!HTMLElement.prototype.insertAdjacentElement) {
            HTMLElement.prototype.insertAdjacentElement = function (where, parsedNode) {
                switch (where) {
                    case 'beforeBegin':
                        this.parentNode.insertBefore(parsedNode, this);
                        break;
                    case 'afterBegin':
                        this.insertBefore(parsedNode, this.firstChild);
                        break;
                    case 'beforeEnd':
                        this.appendChild(parsedNode);
                        break;
                    case 'afterEnd':
                        if (this.nextSibling)
                            this.parentNode.insertBefore(parsedNode, this.nextSibling);
                        else this.parentNode.appendChild(parsedNode);
                        break;
                }
            };
            HTMLElement.prototype.insertAdjacentHTML = function (where, htmlStr) {
                var r = this.ownerDocument.createRange();
                r.setStartBefore(this);
                var parsedHTML = r.createContextualFragment(htmlStr);
                this.insertAdjacentElement(where, parsedHTML);
            };
            HTMLElement.prototype.insertAdjacentText = function (where, txtStr) {
                var parsedText = document.createTextNode(txtStr);
                this.insertAdjacentElement(where, parsedText);
            };
        }
    }

    if (!Object.prototype.watch) {
        (function () {
            // object.watch
            if (!Object.prototype.watch) {
                Object.defineProperty(Object.prototype, "watch", {
                    enumerable: false, configurable: true, writable: false,
                    value: function (prop, handler) {
                        var oldval = this[prop],
                            newval = oldval,
                            getter = function () {
                                return newval;
                            },
                            setter = function (val) {
                                oldval = newval;
                                return newval = handler.call(this, prop, oldval, val);
                            };

                        if (delete this[prop]) { // can't watch constants
                            Object.defineProperty(this, prop, { get: getter, set: setter, enumerable: true, configurable: true });
                        }
                    }
                });
            }

            // object.unwatch
            if (!Object.prototype.unwatch) {
                Object.defineProperty(Object.prototype, "unwatch", {
                    enumerable: false, configurable: true, writable: false,
                    value: function (prop) {
                        var val = this[prop];
                        delete this[prop]; // remove accessors
                        this[prop] = val;
                    }
                });
            }
        })();
    }
});
defineModule('jsextend', [], function (module) {

    /**
     *  @overview jsExtend
     **/

    /*jshint unused:false */
    /*global exports:true */

//var scope = (typeof exports === 'object') ? exports : window;
//var scope =  ('undefined' === typeof window) ? GLOBAL : window;

    "use strict";

    /**
     * fix default prototype's constructor
     * @param {Function} constructor
     */
    var fixConstructor = function fixConstructor (constructor) {
        "use strict";

        if ('function' != typeof constructor) {
            throw new TypeError(constructor + ' is not function');
        }
        if (constructor.prototype.constructor == Object.prototype.constructor) {
            constructor.prototype.constructor = constructor;
        }
    };

    /**
     * modify child's prototype object by inherits from paret's prototype
     * @param {Function} child
     * @param {Function} parent
     */
    var inherit = function inherit (child, parent) {
        "use strict";

        fixConstructor(child);
        fixConstructor(parent);
        var a = Object.create(parent.prototype);
        for (var prop in child.prototype)
            if (child.prototype.hasOwnProperty(prop))
                a[prop] = child.prototype[prop];
        child.prototype = a;

        // reference to parent
        // to call parent constructor:
        // child.prototype.base.constructor.call(this, args);
        child.prototype.base = parent.prototype;
    };

    /*
    (function(){
        "use strict";

        console.log('@ test.inherit');

        var P = function P (a) {
            this.a = a;
        };
        P.prototype = {
            constructor:P,
            M:function(){this.a++;}
        };
        var C = function C (b) {
            C.prototype.base.constructor.call(this, b+1);
            this.b = b;
        };
        C.prototype = {
            constructor:C,
            M:function(){this.b++;},
            M2:function(){}
        };
        inherit(C,P);
        var c = new C(20);
    })();
    */

    var extend = function extend (target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
        return target;
    };

    module.inherit = inherit;
    module.extend = extend;
});
defineModule('Loader', [], function (module) {
    /**
     *  @overview Loader
     **/

    'use strict';

    var Loader = function (list, root) {
        this.list = list;
        this.loaded = false;
        this.root = (root === undefined) ? '' : root;
    };
    Loader.prototype.load = function (callback, callback_progress) {

        console.log('@ loader.start. ', this.list);

        var imageCount = this.list.length;

        if (imageCount === 0) {
            this.loaded = true;
            callback();
            return;
        }

        var that = this;
        var currentIndex = 0;
        var onload = function () {
            currentIndex++;
            console.log('@ loader.progress: %s/%s', currentIndex, imageCount);
            if (callback_progress) {
                callback_progress(currentIndex, imageCount);
            }
            if (currentIndex == imageCount) {
                that.loaded = true;
                console.log('@ loader.done.');
                callback();
            }
        };
        var onerror = function (e) {
            console.log('@ loader.error');
            onload();
        };
        for (var i = 0; i < this.list.length; i++) {
            var image = new Image();
            image.onload = onload;
            image.onerror = onerror;
            image.src = this.root + this.list[i].src;
            this.list[i].data = image;
        }
    };

    module.Loader = Loader;

});
defineModule('css', [], function (module) {

    /**
     * @overview Css module.
     */

    var convertNumber = function (value) {
        var v = Number(value);
        if (!Number.isFinite(v)) {
            console.error('incorect parameters', value);
            return 0;
        }
        if ((v > 1e10) || (v < -1e10)) {
            console.error('incorect parameters', value);
            return 0;
        }
        if ((v < 1e-5) && (v > -1e-5)) {
            return 0;
        }
        v = Math.round(v * 100000) / 100000;
        return v;
    };

    var needprefix = [
        'transform-style',
        'transform-origin',
        'transform',
        'perspective',
        'perspective-origin',
        'animation',
        'animation-name',
        'animation-duration',
        'animation-play-state',
        'animation-fill-mode'
    ];

    var cssPropertiesNameMap = {};

    var transformOnlyCssSet = ';transform:';

    var Enables = {
        supportsTransitions: false,
        supportsAnimations: false,
        supports3d: false,
        prefix: '',
        defPrefix: '',
        detect: function () {
            var e = this;
            e.supportsTransitions = false;
            e.prefix = '';
            e.defPrefix = '';

            //anim
            e.supportsAnimations = false;
            e.animPrefix = '';
            e.animString = 'Animation';
            e.keyframePrefix = '';

            var div = document.createElement('div');

            var prefs = 'Webkit Moz O ms Khtml'.split(' ');

            if (div.style.animationName) {
                e.supportsAnimations = true;
            }
            if (e.supportsAnimations === false) {
                for (var i = 0; i < prefs.length; i++) {
                    if (div.style[ prefs[i] + 'Animation' ] !== undefined) {
                        e.animPrefix = prefs[ i ];
                        e.animString = e.animPrefix + 'Animation';
                        e.keyframePrefix = '-' + e.animPrefix.toLowerCase() + '-';
                        e.supportsAnimations = true;
                        break;
                    }
                }
            }

            //transform
            e.supportsTransformations = false;
            e.transformationPrefix = '';
            e.transformationCssPrefix = '';
            e.transformationString = 'Transform';

            if (div.style.transform) {
                e.supportsTransformations = true;
            }
            if (e.supportsTransformations === false) {
                for (var i = 0; i < prefs.length; i++) {
                    if (div.style[ prefs[i] + 'Transform' ] !== undefined) {
                        e.transformationPrefix = prefs[ i ];
                        e.transformationString = e.transformationPrefix + 'Transform';
                        e.transformationCssPrefix = '-' + e.transformationPrefix.toLowerCase() + '-';
                        e.supportsTransformations = true;
                        break;
                    }
                }
            }

            //transition
            e.supportsTransitions = false;
            e.transitionPrefix = '';
            e.transitionCssPrefix = '';
            e.transitionString = 'Transition'

            if (div.style.transition) {
                e.supportsTransitions = true;
            }
            if (e.supportsTransitions === false) {
                for (var i = 0; i < prefs.length; i++) {
                    if (div.style[ prefs[i] + 'Transition' ] !== undefined) {
                        e.transitionPrefix = prefs[ i ];
                        e.transitionString = e.transitionPrefix + 'Transition';
                        e.transitionCssPrefix = '-' + e.transitionPrefix.toLowerCase() + '-';
                        e.supportsTransitions = true;
                        break;
                    }
                }
            }

            e.supports3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix() && 'webkitPerspective' in div.style;

            this._buildMap();
        },
        _buildMap: function () {
            for (var i = 0; i < needprefix.length; i++) {
                cssPropertiesNameMap[needprefix[i]] = (Enables.transformationCssPrefix + needprefix[i]);
            }
            transformOnlyCssSet = ';' + Enables.transformationCssPrefix + 'transform:';
        }
    };

    var CSSTransform = {
        translateX: function (x) {
            x = convertNumber(x);
            return ' translateX(' + x + 'px) ';
        },
        translateY: function (y) {
            y = convertNumber(y);
            return ' translateY(' + y + 'px) ';
        },
        translateZ: function (z) {
            z = convertNumber(z);
            return ' translateZ(' + z + 'px) ';
        },
        translate3d: function (x, y, z) {
            x = convertNumber(x);
            y = convertNumber(y);
            z = convertNumber(z);
            return ' translate3d(' + x + 'px,' + y + 'px,' + z + 'px) ';
        },
        translate: function (x, y) {
            x = convertNumber(x);
            y = convertNumber(y);
            return ' translate(' + x + 'px,' + y + 'px) ';
        },
        rotateX: function (deg) {
            deg = convertNumber(deg);
            return ' rotateX(' + deg + 'deg) ';
        },
        rotateY: function (deg) {
            deg = convertNumber(deg);
            return ' rotateY(' + deg + 'deg) ';
        },
        rotateZ: function (deg) {
            deg = convertNumber(deg);
            return ' rotateZ(' + deg + 'deg) ';
        },
        rotate: function (deg) {
            deg = convertNumber(deg);
            return ' rotate(' + deg + 'deg) ';
        },
        rotate3d: function (x, y, z, deg) {
            x = convertNumber(x);
            y = convertNumber(y);
            z = convertNumber(z);
            deg = convertNumber(deg);
            return ' rotate3d(' + x + ',' + y + ',' + 'z' + ',' + deg + 'deg) ';
        },
        scale: function (x, y) {
            x = convertNumber(x);
            y = convertNumber(y);
            return ' scale(' + x + ',' + y + ') ';
        },
        /**
         * eulerAngles in grad -> csstransform
         * @param {Number} psi grad  z
         * @param {Number} theta grad y
         * @param {Number} phi grad  x
         * @return {String} csstransform string
         */
        eulerMatrix: function (psi, theta, phi) {
            return CSSTransform.rotateY(psi) + CSSTransform.rotateX(theta) + CSSTransform.rotateZ(phi);
        }
    };

    /**
     * set Css
     * @param {HTMLElement} elem
     * @param props
     * @returns {string}
     */
    var setCss = function (elem, props) {
        var css = '';
        for (var key in props) {
            var v = cssPropertiesNameMap[key];
            css += ((v !== undefined) ? v : key) + ':' + props[key] + ';';
            //css += ((needprefix.indexOf(key) > -1) ? (Enables.transformationCssPrefix + key) : key) + ':' + props[key] + ';';
        }
        return elem.style.cssText += ';' + css;
    };

    /**
     * set Css Transform
     * @param {HTMLElement} elem
     * @param value
     */
    var setCssTransform = function (elem, value) {
        elem.style.cssText += (transformOnlyCssSet + value);
    };

    /**
     * getStyle
     * @param {HTMLElement} element
     * @returns {CSSStyleDeclaration}
     */
    var getStyle = function (element) {
        return window.getComputedStyle(element, null);
    };

    function init() {
        if (document.readyState === 'complete' || document.readyState == 'loaded' || document.readyState == 'interactive') {
            Enables.detect();
        }
        else {
            document.addEventListener('DOMContentLoaded', init, false);
        }
    }

    init();

    //module.convertNumber = convertNumber;
    //module.Enables = Enables;
    //module.getStyle = getStyle;
    module.CSSTransform = CSSTransform;
    module.setCss = setCss;
    module.setcss = setCss;
    module.setCssTransform = setCssTransform;

});
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
defineModule('audio', [], function (module) {
    /**
     * @overview Audio module.
     * @author tvolodimir@gmail.com
     */

    'use strict';

    var Media = {
        isEnabled: true,
        /**
         * audioSources
         * @type {AudioSource[]}
         */
        audioSources: [],
        /**
         * create AudioSource
         * @param {String} soundURL
         * @param {Number[][]} soundIntervals
         * @return {AudioSource}
         */
        create: function (soundURL, soundIntervals) {
            var as = new AudioSource(soundURL, soundIntervals);
            Media.audioSources.push(as);
            return as;
        },
        /**
         * stop all audio sources
         */
        pauseSounds: function () {
            for (var i = 0; i < Media.audioSources.length; i++) {
                Media.audioSources[i].pauseSound();
            }
        },
        isEnable: function () {
            if (this.audioTypes.length === 0) {
                return false;
            }

            return true;
        },
        audioTypes: [],
        _init: function () {
            var tt = ['audio/mpeg', 'audio/mp4'];
            var res = this.audioTypes, t, a = document.createElement('audio');
            if (a.canPlayType === undefined) {
                return;
            }
            t = a.canPlayType('audio/ogg');
            if (t === 'probably' || t === 'maybe') {
                res.push('ogg');
            }
            t = a.canPlayType('audio/wav');
            if (t === 'probably' || t === 'maybe') {
                res.push('wav');
            }
            t = a.canPlayType('audio/mp3');
            if (t === 'probably' || t === 'maybe') {
                res.push('mp3');
            }
        }
    };

    /**
     * AudioSource
     * @class AudioSource
     * @param {String} soundURL
     * @param {Number[][]} soundIntervals
     * @constructor
     */
    var AudioSource = function AudioSource(soundURL, soundIntervals) {
        this.soundURL = soundURL;
        this.soundIntervals = soundIntervals;

        //create sound object

        /**
         * @type {HTMLAudioElement}
         */
            //this.soundObject = document.createElement('audio');
        this.soundObject = new Audio(this.soundURL);
        var audio = this.soundObject;

        //audio.style.display = 'none';
        //audio.autobuffer = true;
        // audio.autoplay = false;
        // audio.preload = "auto";
        audio.src = soundURL;
        audio.setAttribute("src", this.soundURL);// + audioType);
        // audio.addEventListener("canplaythrough", itemLoaded, false);
        //audio.crossorigin = ;
        //audio.mediagroup
        //  audio.loop = false;
        //audio.muted = true;
        //   audio.controls = false;
        //audio.buffered
        //controller
        //currentTime
        //defaultMuted
        //defaultPlaybackRate
        //duration
        //ended
        //initialTime
        //networkState = 0
        //paused
        //playbackRate
        //played
        //readyState
        //seekable
        //seeking
        //startTime
        //textTracks
        //volume
        /*
         HAVE_CURRENT_DATA: 2
         HAVE_ENOUGH_DATA: 4
         HAVE_FUTURE_DATA: 3
         HAVE_METADATA: 1
         HAVE_NOTHING: 0
         NETWORK_EMPTY: 0
         NETWORK_IDLE: 1
         NETWORK_LOADING: 2
         NETWORK_NO_SOURCE: 3
         */
        //addTextTrack()
        //canPlayType()
        //load()
        //pause()
        //play()
        //webkitAddKey()
        //webkitCancelKeyRequest()
        //webkitGenerateKeyRequest()

        var that = this;

        /*if (typeof audio.loop == 'boolean')
         {
         audio.loop = true;
         }
         else */
        {
            audio.addEventListener('ended', function () {
                that._onEnded();
            }, false);
        }
        //audio.play();


        this.currentSound = 0;
        this.isLooped = false;
        this.ended = true;
        this.loaded = false;

        this.isEnabled = (audio.currentSrc !== undefined);

        //if (audio.networkState == 0) {

        /*   setTimeout(function () {
         audio.volume = 0;
         // audio.load();
         audio.play();
         //setTimeout(function(){audio.pause()},1000);

         }, 1000);   */
        //}

        audio.addEventListener("progress", function () {
            that._onProgress();
        }, false);
        // audio.addEventListener("canplaythrough", audioLoaded, false);


        if (this.isEnabled) {
            var g = this;
            //audio.addEventListener('timeupdate', handler, false);
            audio.addEventListener('loadeddata', function (e) {
                g._soundTimeChanged();
            }, false);
            audio.addEventListener('canplaythrough', function (e) {
                if (g.loaded) return;
                g.loaded = true;

                g.onLoaded();
            }, false);

            window.addEventListener('DOMContentLoaded', function (e) {
            }, false);
            window.addEventListener('unload', function (e) {
                //g.pauseSound();
                //g.soundObject.src = '';
            }, false);
            window.addEventListener('pageshow', function (e) {
                // Prevent black screen when going back from the previous page
                //document.body.className = document.body.className;
                //g.playSound();
            }, false);
            window.addEventListener('pagehide', function (e) {
                //g.pauseSound();
            }, false);
        }

        this.onLoaded = function () {
        };
    };
    AudioSource.prototype = {
        constructor: AudioSource,

        _onProgress: function () {
            var a = this.soundObject;
            //var percentLoaded = parseInt(((a.buffered.end(0) / a.duration) * 100));
            //console.log(this.soundURL, a.buffered.end(0), a.duration, a.buffered.start(0), percentLoaded);
        },
        _onEnded: function () {
            if (this.isLooped === true && this.soundIntervals.length === 1) {
                this.soundObject.volume = 1;
                this.soundObject.currentTime = 0;
                this.soundObject.play();
            }
        },

        pauseSound: function () {
            if (Media.isEnabled == false || this.isEnabled == false) {
                return;
            }

            if (!this.soundObject.paused) {
                this.soundObject.pause();
            }
        },
        _soundTimeChanged: function () {
            var interval = this.soundIntervals[this.currentSound];
            if (interval) {
                if (this.soundObject.currentTime > interval[1]) {
                    if (this.isLooped) {
                        this.soundObject.currentTime = interval[0];
                    }
                    else {
                        this.ended = true;
                        this.pauseSound();
                    }
                }
            }
            else {
                this.pauseSound();
            }
        },

        mute: function () {
            this.soundObject.volume = 0;
        },

        unmute: function () {
            this.soundObject.volume = 1;
        },

        playSound: function (index, isLooped) {
            if (Media.isEnabled == false || this.isEnabled == false) {
                return;
            }

            if (this.soundObject.networkState == this.soundObject.NETWORK_NO_SOURCE) {
                return;
            }

            if (!this.loaded) {
                return;
            }

            if (index === undefined && isLooped === undefined && this.ended === false && this.currentSound > -1 && this.soundObject.paused) {
                // unpause
                this.soundObject.play();
            }

            if (!this.soundIntervals[index]) {
                return;
            }

            //if (this.soundObject.networkState !== this.soundObject.NETWORK_IDLE) {
            //    return
            //}

            // this.pauseSound();

            try {
                this.soundObject.currentTime = this.soundIntervals[index][0];

                this.currentSound = index;
                this.isLooped = isLooped;
                this.ended = false;

                this.soundObject.currentTime = this.soundIntervals[this.currentSound][0];
                this.soundObject.volume = 1;

                if (this.soundObject.paused) {
                    this.soundObject.volume = 1;
                    this.soundObject.play();
                }
            }
            catch (e) {
                this.currentSound = -1;
                this.pauseSound();
            }
        }
    };


    function init() {
        if (document.readyState === 'completed' || document.readyState == 'loaded' || document.readyState == 'interactive') {
            Media._init();
        }
        else {
            document.addEventListener('DOMContentLoaded', init, false);
        }
    }

    init();

    module.Media = Media;
    //module.AudioSource = AudioSource;

    function loadAudio(uri) {
        var audio = new Audio();
        //audio.onload = isAppLoaded; // It doesn't works!
        audio.addEventListener('canplaythrough', isAppLoaded, false); // It works!!
        audio.src = uri;
        return audio;
    }

    //module.loadAudio = loadAudio;
});
defineModule('game5', ['jsshiv', 'jsextend', 'css', 'Loader', 'animation', 'audio'], function (module) {
    /**
     * @overview Game5 "Pairs".
     * @author tvolodimir@gmail.com
     * @copyright (c) Terebus Volodymyr
     */

    'use strict';

    var $r = scope.$simpleModuleManager.getModule;
    var setcss = $r('css').setcss;
    var extend = $r('jsextend').extend;
    var Loader = $r('Loader').Loader;
    var Emitter = $r('animation').Emitter;
    var Throttle = $r('animation').Throttle;
    var animate2 = $r('animation').animate2;
    var Media = $r('audio').Media;

    /**
     * copy array
     * @param {Array} array
     * @return {Array}
     */
    var copyArray = function (array) {
        if (array === undefined) {
            return undefined;
        }
        if (array === null) {
            return null;
        }
        var r = [];
        for (var i = 0; i < array.length; i++) {
            r[i] = array[i];
        }
        return r;
    };
    /**
     * random sort
     * @param {Array} array
     * @returns {boolean}
     */
    var fisherYates = function (array) {
        var i = array.length, j, temp;
        if (i === 0) return false;
        while (--i) {
            j = Math.floor(Math.random() * ( i + 1 ));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return true;
    };
    /**
     * unbind element from parent
     * @param {HTMLElement} element
     */
    var unbindElement = function (element) {
        if (!element || !element.parentNode) return;
        element.parentNode.removeChild(element);
    };

    /**
     * Cell
     * @param {{value:Object, enable:Boolean, index:int}} options
     * @constructor
     * @class Cell
     */
    var Cell = function (options) {

        /**
         * count of rotates
         * @type {int}
         */
        this.rotatesCount = 0;

        /**
         * last trap Time
         * @type {number}
         */
        this.lastRotateTime = 0;

        /**
         * is rotated
         * @type {boolean}
         */
        this.isRotated = false;

        this.value = options.value;

        this.foundPair = null;

        this.enable = options.enable;

        this.index = options.index;
    };
    Cell.prototype = {
        constructor: Cell,

        rotate: function () {
            if (this.isRotated === false) {
                this.lastRotateTime = Date.now();
                this.isRotated = true;
                this.rotatesCount++;
                return {
                    result: true,
                    value: this.value
                };
            }
            return {
                result: false,
                value: null
            };
        }
    };

    /**
     * Game
     * @param {{rowsCount:int, columnsCount:int, cellsEnables:boolean[], values:int[]}} options
     * @constructor
     * @class
     */
    var Game = function (options) {
        /**
         * cells
         * @type {Cell[]}
         */
        this.cells = [];
        this.rotatedCells = [];
        this.pairs = [];

        this.options = options;
        this._init();

        this.pairsToWin = (this.cells.length / 2) | 0;

        this.turns = [];

        this.score = 0;
    };
    Game.prototype = {
        constructor: Game,
        _init: function () {
            var op = this.options;

            for (var j = 0; j < op.rowsCount; j++) {
                // this.cells[j] = [];
                for (var i = 0; i < op.columnsCount; i++) {
                    var cell = new Cell({
                        columnIndex: i,
                        enable: op.cellsEnables[j * op.columnsCount + i],
                        index: j * op.columnsCount + i,
                        value: op.values[j * op.columnsCount + i]
                    });
                    this.cells.push(cell);
                }
            }
        },
        /**
         * rotate
         * @param {int} cellIndex
         */
        rotate: function (cellIndex) {
            var cell = this._findCell(cellIndex);
            if (cell === null || cell === undefined) {
                return {
                    result: false
                };
            }
            var r = cell.rotate();
            if (r.result === true) {
                this.rotatedCells.push(cell);


                var ret = this._onRotated();

                var incScore = (ret.match === true) ? 10 : 0;

                var turn = {
                    index: cellIndex,
                    time: Date.now(),
                    score: this.score,
                    incScore: incScore
                };

                this.turns.push(turn);

                this.score += incScore;

                return extend({
                    result: true,
                    firstTurnTime: this.turns[0].time,
                    turn: turn,
                    turnsCount: this.turns.length,
                    isEnd: this.pairsToWin === this.pairs.length
                }, ret);
            }
            return {
                result: false
            };
        },
        _findCell: function (cellIndex) {
            for (var i = 0; i < this.cells.length; i++) {
                var t = this.cells[i];
                if (t.index === cellIndex) {
                    return t;
                }
            }
            return null;
        },
        _onRotated: function () {
            var rotatedCopy = [];
            for (var i = 0; i < this.rotatedCells.length; i++) {
                var c = this.rotatedCells[i];
                rotatedCopy[i] = {
                    index: c.index,
                    value: c.value
                }
            }
            if (this.rotatedCells.length === 2) {
                var match = null;
                if (this.rotatedCells[0].value === this.rotatedCells[1].value) {
                    var pair = [this.rotatedCells[0], this.rotatedCells[1]];
                    this.rotatedCells[0].foundPair = pair;
                    this.rotatedCells[1].foundPair = pair;
                    this.pairs.push([this.rotatedCells[0].index, this.rotatedCells[1].index]);
                    match = true;
                }
                else {
                    match = false;
                    this.rotatedCells[0].isRotated = false;
                    this.rotatedCells[1].isRotated = false;
                }
                this.rotatedCells = [];
            }
            return {
                match: match,
                rotated: rotatedCopy
            };
        }
    };

    /**
     * CellUI
     * @param {{rowIndex:int, columnIndex:int, board:Board, enable:Boolean, index:int}} options
     * @constructor
     * @class CellUI
     */
    var CellUI = function (options) {
        this.enable = options.enable === undefined ? true : options.enable;
        this.index = options.index;

        this.board = options.board;
        this.columnIndex = options.columnIndex;
        this.rowIndex = options.rowIndex;

        var op = this.board.options;

        this.cellElement = document.createElement("div");
        this.cellElement.classList.add('cell');
        setcss(this.cellElement, {
            left: this.columnIndex * (op.cellWidth + op.paddingWidth) + 'px',
            top: this.rowIndex * (op.cellHeight + op.paddingHeight) + 'px',
            width: op.cellWidth + 'px',
            height: op.cellHeight + 'px'
        });
        op.container.insertAdjacentElement('beforeEnd', this.cellElement);

        this.cellElementFront = document.createElement("div");
        this.cellElementFront.classList.add('cellFront');
        this.cellElement.insertAdjacentElement('beforeEnd', this.cellElementFront);

        this.cellElementBack = document.createElement("canvas");
        this.cellElementBack.classList.add('cellBack');
        this.cellElement.insertAdjacentElement('beforeEnd', this.cellElementBack);

        this.cellElementBack.width = op.cellWidth;
        this.cellElementBack.height = op.cellHeight;
        this.ctx = this.cellElementBack.getContext('2d');

        var cell = this;
        this.cellElement.addEventListener("mousedown", function () {
            cell.onClick();
        }, false);

        this.__onFrontfaced = function () {
            cell.onFrontfaced();
        }
        this.isAnimating = false;
    };
    CellUI.prototype = {
        constructor: CellUI,
        _findCell: function (index, cells) {
            for (var i = 0; i < cells.length; i++) {
                var t = cells[i];
                if (t.index === index) {
                    return t;
                }
            }
            return null;
        },
        setProxy: function (proxy) {
            var op = this.board.options;
            var c = this.ctx;
            var img = imageResources[proxy.value].data;
            if (img) {
                c.drawImage(img, 0, 0, img.width, img.height, 0, 0, op.cellWidth, op.cellHeight);
            }
            else {
                c.fillStyle = "#00F";
                c.font = 'bold 30pt Arial';
                c.fillText(proxy.value, 20, 50);
            }

        },
        animateToBackface: function (cb) {
            var cell = this;
            //if (cell.isAnimating === true) return;
            cell.isAnimating = true;
            animate2(this, '_animation_ToBackface', 0, 500,
                function () {
                    setcss(cell.cellElement, {
                        'animation-name': 'cellAnimation',
                        'animation-duration': '500ms',
                        'animation-fill-mode': 'forwards'
                    });
                },
                function () {
                    cell.cellElement.classList.add('cellFlipped');
                    setcss(cell.cellElement, {
                        'animation-name': 'none'
                    });
                    if (cb !== null && cb !== undefined) {
                        cb();
                    }
                },
                function () {
                    cell.isAnimating = false;
                });
            if (this.board.paused && this['_animation_ToBackface']) this['_animation_ToBackface'].pause();
        },
        animateToFrontface: function (cb) {
            var cell = this;
            //if (cell.isAnimating === true) return;
            cell.isAnimating = true;
            animate2(this, '_animation_ToFrontface', 0, 500,
                function () {
                    setcss(cell.cellElement, {
                        'animation-name': 'cellAnimationBack',
                        'animation-duration': '500ms',
                        'animation-fill-mode': 'forwards'
                    });
                },
                function () {
                    cell.cellElement.classList.remove('cellFlipped');
                    setcss(cell.cellElement, {
                        'animation': 'none'
                    });
                    if (cb !== null && cb !== undefined) {
                        cb();
                    }
                },
                function () {
                    cell.isAnimating = false;
                });
            if (this.board.paused && this['_animation_ToFrontface']) this['_animation_ToFrontface'].pause();
        },
        animateToHide: function (cb) {
            var cell = this;
            //if (cell.isAnimating === true) return;
            cell.isAnimating = true;
            animate2(this, '_animation_ToHide', 0, 1500,
                function () {
                    setcss(cell.cellElement, {
                        'animation-name': 'cellAnimationHide',
                        'animation-duration': '1500ms',
                        'animation-fill-mode': 'forwards'
                    });
                    cell.cellElement.classList.add('cellHide');
                },
                function () {
                    cell.cellElement.classList.add('cellHide');
                    setcss(cell.cellElement, {
                        'animation': 'none'
                    });
                    if (cb !== null && cb !== undefined) {
                        cb();
                    }
                },
                function () {
                    cell.isAnimating = false;
                });
            if (this.board.paused && this['cellAnimationHide']) this['cellAnimationHide'].pause();
        },
        isEnable: function () {
            return !this['_animation_ToBackface'] && !this['_animation_ToFrontface'] && !this['_animation_ToHide'] && !this.isAnimating && !this.cellElement.classList.contains('cellFlipped');
        },
        onClick: function () {
            var cell = this;
            if (this.isEnable()) {
                if (!this.cellElement.classList.contains('cellFlipped')) {

                    GameProxy.current.rotate(cell.index, function (ret) {
                        if (ret.result === true) {
                            cell.isAnimating = true;
                            console.log(ret);
                            cell.animateToBackface(function () {
                                if (ret.match === true) {
                                    var cell1 = cell.board.getCellByIndex(ret.rotated[0].index);
                                    cell1.enable = false;
                                    cell1.animateToHide();
                                    var cell2 = cell.board.getCellByIndex(ret.rotated[1].index);
                                    cell2.enable = false;
                                    cell2.animateToHide();
                                }
                                else if (ret.match === false) {
                                    var cell1 = cell.board.getCellByIndex(ret.rotated[0].index);
                                    cell1.animateToFrontface(cell.__onFrontfaced);
                                    var cell2 = cell.board.getCellByIndex(ret.rotated[1].index);
                                    cell2.animateToFrontface(cell.__onFrontfaced);
                                }
                                else {

                                }
                            });
                            cell.setProxy(cell._findCell(cell.index, ret.rotated));
                        }
                    });
                }
            }
        },
        onFrontfaced: function () {
            var op = this.board.options;
            var c = this.ctx;
            c.clearRect(0, 0, op.cellWidth, op.cellHeight);
        },
        pause: function () {
            if (this['_animation_ToBackface']) this['_animation_ToBackface'].pause();
            if (this['_animation_ToFrontface']) this['_animation_ToFrontface'].pause();
            if (this['_animation_ToHide']) this['_animation_ToHide'].pause();
            //this.fixTransform = getStyle(this.cellElement).webkitTransform;
            //console.log('out',this.fixTransform);
            setcss(this.cellElement, {
                //'transform': this.fixTransform,
                'animation-play-state': 'paused'
            });
        },
        resume: function () {
            if (this['_animation_ToBackface']) this['_animation_ToBackface'].resume();
            if (this['_animation_ToFrontface']) this['_animation_ToFrontface'].resume();
            if (this['_animation_ToHide']) this['_animation_ToHide'].resume();
            //console.log('in',this.fixTransform);
            setcss(this.cellElement, {
                //'transform': this.fixTransform,
                'animation-play-state': 'running'
            });
        }
    };

    /**
     * Board
     * @param options
     * @constructor
     * @class BoardUI
     */
    var BoardUI = function (options) {
        this.options = extend({
            container: window.document.body,
            rowsCount: 5,
            columnsCount: 5,
            paddingWidth: 1,
            paddingHeight: 1,
            cellWidth: 50,
            cellHeight: 50
        }, options);

        /**
         * cells
         * @type {CellUI[]}
         * @private
         */
        this._cells = [];

        this.paused = false;

        this._init();
    };
    BoardUI.prototype = {
        constructor: BoardUI,
        destructor: function (cb) {
            for (var i = 0; i < this._cells.length; i++) {
                unbindElement(this._cells[i].cellElement);
            }
            this._cells.length = 0;
            cb();
        },

        _init: function () {
            var op = this.options;

            for (var j = 0; j < op.rowsCount; j++) {
                for (var i = 0; i < op.columnsCount; i++) {
                    var cell = new CellUI({
                        board: this,
                        rowIndex: j,
                        columnIndex: i,
                        enable: op.cellsEnables[j * op.columnsCount + i],
                        index: j * op.columnsCount + i
                    });
                    this._cells.push(cell);
                }
            }
        },
        /**
         * get Position Information
         * @param {Number} x
         * @param {Number} y
         * @returns {{rowIndex:int, columnIndex:int, localPosition:{x:Number, y:Number}}}
         */
        getPositionInformation: function (x, y) {
            var op = this.options;

            var rowIndex = Math.floor(y / (op.cellHeight + op.paddingHeight));
            var columnIndex = Math.floor(x / (op.cellWidth + op.paddingWidth));

            if (rowIndex > -1 && columnIndex > -1 && rowIndex < op.columnsCount && columnIndex < op.rowsCount) {
                var localPosition = {
                    x: x - columnIndex * (op.cellWidth + op.paddingWidth),
                    y: y - rowIndex * (op.cellHeight + op.paddingHeight)
                };
                if ((localPosition.x < op.cellWidth ) && (localPosition.y < op.cellHeight)) {
                    return {
                        rowIndex: rowIndex,
                        columnIndex: columnIndex,
                        localPosition: localPosition
                    };
                }
            }
            return null;
        },
        /**
         * get cell
         * @param {int} columnIndex
         * @param {int} rowIndex
         * @returns {Cell}
         */
        getCell: function (columnIndex, rowIndex) {
            var cell = this._cells[rowIndex * this.options.columnsCount + columnIndex];
            return cell ? cell : null;
        },
        /**
         * get Cell by Index
         * @param {int} index
         * @return {CellUI}
         */
        getCellByIndex: function (index) {
            for (var i = 0; i < this._cells.length; i++) {
                if (this._cells[i].index === index) {
                    return this._cells[i];
                }
            }
            return null;
        },

        pause: function () {
            if (this.paused === true) return;
            this.paused = true;
            for (var i = 0; i < this._cells.length; i++) {
                this._cells[i].pause();
            }

            this.options.container.classList.add('paused');
        },
        resume: function () {
            if (this.paused === false) return;
            this.paused = false;
            for (var i = 0; i < this._cells.length; i++) {
                this._cells[i].resume();
            }
            this.options.container.classList.remove('paused');
        }
    };

    var GameProxy = function () {
        this._initBase();
        this.stats = {
            gamesStats: []
        };
        this.gameIndex = 0;
        this.state = {
            initialized: false,
            disposing: false,
            playerInputEnable: false,
            value: 'notinitialized',
            startTime: null,
            score: 0,
            incScore: 0,
            turnsCount: 0
        };
    };
    GameProxy.prototype = {
        /**
         * static initialize
         * @private
         */
        _initBase: function () {
            this.gameContainer = document.querySelector('#game5-container');
            this.gameViewport = this.gameContainer.querySelector('.game-viewport');
            this.gameStage = this.gameContainer.querySelector('.game-stage');
            this.boardContainer = this.gameContainer.querySelector('.game-board');
            this.gameStat = this.gameContainer.querySelector('.game-stat');
            this.btnStart = this.gameContainer.querySelector('.btn-start');

            var g = this;

            this.btnStart.addEventListener("mousedown", function () {
                g.btnStart.classList.remove('visible');
                g.createNewGame();
            }, false);

            this.audio1 = Media.create(rootFolder + audioResources[0].src, [[0, 0.105]]);
            this.audio1.onLoaded = function () { };

            new Loader(imageResources, rootFolder).load(function () { });
        },
        /**
         * init game
         * @param {{columnsCount:int, rowsCount:int, cellsEnables:boolean[], pairs:int[][]}} options
         * @constructor
         */
        _initGameUI: function (options) {
            this.op = {
                columnsCount: options.columnsCount,
                rowsCount: options.rowsCount,
                cellWidth: 141/2,
                cellHeight: 188/2,
                paddingWidth: 7,
                paddingHeight: 7
            };
            var op = this.op;
            var w = op.columnsCount * op.cellWidth + op.paddingWidth * (op.columnsCount - 1);
            var h = op.rowsCount * op.cellHeight + op.paddingHeight * (op.rowsCount - 1);

            var containerSize = {width: w + 50, height: h + 100};

            setcss(this.gameViewport, {
                width: containerSize.width + 'px',
                height: containerSize.height + 'px'
            });

            this._updateControl({score: 0, time: 0, turns: 0});

            this.board = new BoardUI(extend({
                container: this.boardContainer,
                cellsEnables: options.cellsEnables
            }, this.op));
        },
        onGameOver: function () {
            this.btnStart.classList.add('visible');
        },
        createNewGame: function () {
            var that = this;
            if (this.state.initialized === true) {
                // save current state
                if (this.state.disposing === false) {
                    console.log('disposing');
                    this.state.disposing = true;
                    this.stats.gamesStats.push({
                        endInitiator: 'user',
                        endTime: Date.now()
                    });
                    this.board.destructor(function () {
                        that.state.disposing = false;
                        that.state.initialized = false;
                        that.createNewGame();
                    });
                }
                return;
            }

            this.gameIndex++;

            var op = {
                rowsCount: 4,
                columnsCount: 4,
                cellsCount: 16,
                cellsEnables: [],
                gameIndex: this.gameIndex,
                values: [],
                pairs: [],
                startTime: Date.now()
            };

            var cellsValues = [];
            for (var i = 0; i < op.cellsCount; i++) {
                op.cellsEnables[i] = 1;
                cellsValues[i] = ((i/2)|0) % 3;
            }
            fisherYates(cellsValues);

            op.values = cellsValues;

            this.currentGameOptiont = extend({
                cellsValue: cellsValues
            }, op);

            this.currentGame = new Game(op);
            console.log('creating new');
            this._initGameUI({
                rowsCount: op.rowsCount,
                columnsCount: op.columnsCount,
                cellsEnables: op.cellsEnables,
                pairs: op.pairs
            });
            this.state.initialized = true;
        },
        /**
         * update game stats
         * @param {{score:int, time:int, turns:int}} state
         * @private
         */
        _updateControl: function (state) {
            var s = this.state;
            if (state === undefined) state = {};
            if (state.score === undefined) state.score = s.score + s.incScore;
            if (state.time === undefined) state.time = Math.round((Date.now() - s.startTime) / 1000);
            if (state.turns === undefined) state.turns = s.turnsCount;
            this.gameStat.querySelector(".score span").innerHTML = state.score;
            this.gameStat.querySelector(".time span").innerHTML = state.time;
            this.gameStat.querySelector(".turns span").innerHTML = state.turns;
        },
        /**
         * proxy call to rotate
         * @param {int} cellIndex
         * @param {function} cb
         */
        rotate: function (cellIndex, cb) {
            var that = this;
            this.audio1.playSound(0, false);
            var ret = this.currentGame.rotate(cellIndex);
            if (ret.result === true) {
                var s = that.state;
                s.score = ret.turn.score;
                s.incScore = ret.turn.incScore;
                s.turnsCount = ret.turnsCount;


                if (this.state.startTime === null) {
                    s.startTime = ret.firstTurnTime;

                    this.state.emitter = new Emitter();
                    this.state.emitter.join(new Throttle(500)).join({next: function () {
                        that._updateControl();
                    }});
                    this.state.emitter.start();
                }

                if (ret.isEnd === true) {
                    this.state.emitter.stop();
                    this._updateControl();
                    this.state.startTime = null;

                    this.onGameOver();
                }
            }
            cb(ret);
        }
    };

    var audioResources = [
        {
            name: 'click',
            src: 'assets/audio/107146__bubaproducer__button-27.wav'
        }
    ];

    var imageResources = [

        {src: 'assets/twinsclub/cardBall.png'},
        {src: 'assets/twinsclub/cardMushroom.png'},
        {src: 'assets/twinsclub/cardStar.png'}

        /*{
            src: 'assets/twinsclub/cardBack.png',
            data: null,
            width: 141,
            height: 188
        },*/
    ];

    var rootFolder = '';

    module.Game = {
        setRoot: function (root) {
            rootFolder = root;
        },
        init: function () {
            GameProxy.current = new GameProxy();
        },
        createNewGame: function () {
            GameProxy.current.createNewGame();
        },
        pause: function () {
            GameProxy.current.board.pause();
        },
        resume: function () {
            GameProxy.current.board.resume();
        },
        dispose: function () {
            if (GameProxy.current.board) {
                GameProxy.current.board.destructor();
            }
        },
        muteMusic: function () {

        },
        muteSounds: function () {

        },
        setMusicVolume: function (value) {

        },
        setSoundsVolume: function (value) {

        },
        getMusicVolume: function () {

        },
        getSoundsVolume: function () {

        },
        getStats: function () {

        },
        onExit: function () {

        },
        demo: function () {
            var cells = GameProxy.current.board._cells;
            var copycells = copyArray(cells);
            fisherYates(copycells);
            for (var i = 0; i < cells.length; i++) {
                copycells[i].onClick();
            }
        },
        demo2: function () {
            var cells = GameProxy.current.board._cells;
            var enableCells = [];
            var notfound = 0;
            var triedpairs = [];

            var func = function () {
                var i, j;
                enableCells = [];
                notfound = 0;
                for (i = 0; i < cells.length; i++) {
                    if (cells[i].enable) notfound++;
                    if (cells[i].enable && cells[i].isEnable())
                        enableCells.push(i);
                }
                if (enableCells.length > 1) {
                    console.log('enableCells %s', enableCells.length, enableCells);
                    var n = enableCells.length;
                    //var k = n*(n-1)/2;
                    var enablesPairs = 0;
                    var used = [];
                    var index = 0;

                    for (j = 0; j < enableCells.length - 1; j++) {
                        var p = triedpairs[enableCells[j]];
                        if (p === undefined) {
                            index += (enableCells.length - 1 - j);
                            enablesPairs += (enableCells.length - 1 - j);
                        }
                        else {
                            for (i = j + 1; i < enableCells.length; i++) {
                                if (p[enableCells[i]] === undefined) {
                                    enablesPairs += 1;
                                }
                                else {
                                    used.push(index)
                                }
                                index++;
                            }
                        }
                    }

                    if (enablesPairs > 0) {
                        var t = generateRandomSubArray(enablesPairs, 1)[0];
                        for (j = 0; j < used.length; j++) {
                            if (used[j] <= t) {
                                t++;
                            }
                        }
                        console.log('enablesPairs %s allPairs %s pairIndex %s', enablesPairs, n * (n - 1) / 2, t);
                        index = 0;
                        var pair;
                        for (j = 0; j < n - 1; j++) {
                            var d = n - 1 - j;
                            if (index + d > t) {
                                pair = [enableCells[j], enableCells[j + 1 + t - index]];
                                break;
                            }
                            index += d;
                        }
                        console.log('pair %s %s', pair[0], pair[1]);
                        if (triedpairs[pair[0]] === undefined) {
                            triedpairs[pair[0]] = [];
                        }
                        triedpairs[pair[0]][pair[1]] = 1;

                        cells[pair[0]].onClick();
                        cells[pair[1]].onClick();
                    }
                }
                if (notfound > 0)
                    setTimeout(func, 400);
            };
            func();
        }
    };
});
})(window);

//@ sourceMappingURL=game.twinsclub.pack.js.map
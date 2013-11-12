/*! gamesModules - v0.0.1 - Thursday, September 12th, 2013, 11:04:41 PM by tvolodimir */
/* Twinsclub's modules and dependencies */
(function (scope) {
    'use strict';
if (typeof scope.$simpleModuleManager === 'undefined') {

    var module = {};
    module.loaded = {};
    module.defines = {};
    module.getModule = function (name) {
        var m = module.loaded[name];
        if (m !== undefined) {
            return m;
        }
        else {
            // search in-depth
            var stack = [name];
            var backStack = [];
            while (stack.length > 0) {
                var n = stack.pop();
                if (module.loaded[n] === undefined) {
                    backStack.push(n);
                    var d = module.defines[n];
                    if (d !== undefined) {
                        var exdep = false;
                        stack.push(n);
                        for (var i = 0; i < d.requires.length; i++) {
                            var r = d.requires[i];
                            if (module.loaded[r] === undefined) {
                                if (backStack.indexOf(r) > -1) {
                                    throw new Error('circular dependency %s', d.requires[i]);
                                }
                                stack.push(r);
                                exdep = true;
                            }
                        }
                        if (exdep === false) {
                            module.invoke(d.name, d.requires, d.factory, d.exports);
                            stack.pop();
                        }

                    }
                    else {
                        console.error('module %s not defined', n);
                    }
                }
            }
            return  module.loaded[name];
        }
    };
    module.defineLazy = function (name, requires, factory, exports) {
        module.defines[name] = {
            name: name,
            requires: requires,
            factory: factory,
            exports: exports
        };
    };
    module.invoke = function (name, requires, factory, exports) {
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

        if (typeof exports !== 'undefined') {
            exports[name] = module.loaded[name];
        }

        return true;
    };

    scope.$simpleModuleManager = {
        invoke: module.invoke,
        defineLazy: module.defineLazy,
        getModule: module.getModule
    };
}
var defineModule = scope.$simpleModuleManager.invoke;
var module = (typeof module === 'undefined') ? {} : module;
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
    var fixConstructor = function(constructor) {
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
    var inherit = function(child, parent) {
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
    var Parent = function (prop) {
        console.log('parent ctor with ', prop);
        this.prop = prop;
    };
    Parent.prototype = {
        SharedMethod: function () {
            console.log('this is parent shared method ', this.prop);
        }
    };

    var Child = function (prop) {
        console.log('child ctor with ', prop + 1000);
        this.prop = prop;
        Child.prototype.base.constructor.call(this, prop);
    };
    Child.prototype = {
        SharedMethod: function () {
            Child.prototype.base.SharedMethod.call(this);
            console.log('this is parent shared method ', this.prop);
        }
    };

    inherit(Child, Parent);
    var c = new Child(99);
    c.SharedMethod();
    */

    var extend = function(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
        return target;
    };

    String.prototype.replaceSubstr = function (index, howManyToDelete, stringToInsert) {
        if (stringToInsert === undefined) stringToInsert = '';
        if (howManyToDelete === undefined || howManyToDelete < 0) howManyToDelete = 0;
        return this.substr(0, index) + stringToInsert + this.substr(index + howManyToDelete);
    };

    var arrayToString = function (array) {
        var l = '';
        for (var i = 0; i < array.length; i++) {
            l += array[i] + ((i < (array.length - 1)) ? ', ' : '');
        }
        return '[' + l + ']';
    };
    var matrixToString = function (matrix) {
        var l = '';
        for (var row = 0; row < matrix.length; row++) {
            l += '[ ';
            for (var col = 0; col < matrix[0].length; col++) {
                l += matrix[row][col] + ((col < (matrix[0].length - 1)) ? ', ' : '');
            }
            l += ']\n\r';
        }
        return '[' + l + ']';
    };

    /**
     * @return {string}
     */
    var s4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    var generateGuid = function () {
        return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
    };

    module.inherit = inherit;
    module.extend = extend;
    module.arrayToString = arrayToString;
    module.matrixToString = matrixToString;
    module.generateGuid = generateGuid;
}, module.exports);
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
})(window);

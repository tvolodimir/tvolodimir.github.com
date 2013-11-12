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
defineModule('DataTimeBuffer', [], function (module) {

    /**
     *  @overview DataTimeBuffer
     **/

    'use strict';

    function friendlyNumber(value, fractionalDigits) {
        if ((value - (value | 0)) == 0) {
            return value | 0;
        }
        return value.toFixed(fractionalDigits);
    }

    /**
     * Data Time Buffer
     * @param {Array} agregationsInterval recomended [100,1000]
     * @param {Number} timeBufferLength recomended 1000
     * @param {String} name String
     */
    var DataTimeBuffer = function (agregationsInterval, timeBufferLength, name, x_aggregation) {
        this.name = name;
        this.agregations = [];
        this.statratio = [];
        this.offset = (x_aggregation == undefined ? Date.now() : x_aggregation);
        for (var i = 0; i < agregationsInterval.length; i++) {
            this.agregations.push({interval: agregationsInterval[i], length: timeBufferLength, endX: 0, data: [], cursor: 0, undefinedAsZero: true});
            this.statratio[i] = [1];
        }
        this.padding_top = 3;
        this.padding_left = 3;
        this.height_item = 16;
        this.floorheight = 3;
        this.paddingStat = 2;
        this.headheight = 9;
        this.onskeepedaggregatedindexsetlast = false;
        this.calc_averg = false;
        this.width = this.agregations[0].length + 45 + 3;
        this.height = this.agregations.length * 31 + 5;
    };
    DataTimeBuffer.prototype = {
        constructor: DataTimeBuffer,
        /**
         * push value in timeline
         * @param {Number} value
         */
        push: function (value, x_aggregation) {
            var now = (x_aggregation == undefined ? Date.now() : x_aggregation) - this.offset,
                a, x, i;
            for (i = 0; i < this.agregations.length; i++) {
                a = this.agregations[i];
                x = (now / a.interval) | 0; // "x|0" = trunc(x)
                var lastvalue = a.data[a.cursor];
                var count = x - a.endX;
                if (this.onskeepedaggregatedindexsetlast) {
                    //console.log(count);
                }
                if (count > 0) {
                    if (count > 1) {
                        for (var j = 0; j < count - 1; j++) {
                            a.cursor++;
                            if (a.cursor == a.length) a.cursor = 0;
                            if (this.onskeepedaggregatedindexsetlast) {
                                a.data[a.cursor] = lastvalue;
                                //console.log(lastvalue);
                            }
                            else {
                                a.data[a.cursor] = undefined;
                            }
                        }
                    }
                    a.cursor++;
                    if (a.cursor == a.length) a.cursor = 0;
                    a.data[a.cursor] = value;
                    a.endX = x;
                }
                else if (count == 0) {
                    if (a.data[a.cursor] == undefined) {
                        a.data[a.cursor] = value;
                    }
                    else {
                        if (this.calc_averg) {
                            a.data[a.cursor] = .5 * (a.data[a.cursor] + value);
                        }
                        else {
                            a.data[a.cursor] += value;
                        }

                    }
                }
                else {
                    if (count > -(a.length - 1)) {
                        var index = a.cursor - count;
                        if (index < 0) index += (a.length - 1);
                        if (a.data[index] == undefined) {
                            a.data[index] = value;
                        }
                        else {
                            if (this.calc_averg) {
                                a.data[a.cursor] = .5 * (a.data[a.cursor] + value);
                            }
                            else {
                                a.data[a.cursor] += value;
                            }
                        }

                    }
                }
            }
        },
        /**
         * update timeline to nowtime
         */
        update: function (x_aggregation) {
            var now = (x_aggregation == undefined ? Date.now() : x_aggregation) - this.offset,
                a, x, i;
            for (i = 0; i < this.agregations.length; i++) {
                a = this.agregations[i];
                x = (now / a.interval) | 0;
                var lastvalue = a.data[a.cursor];
                var count = x - a.endX;
                if (count > 1) {
                    for (var j = 0; j < count - 1; j++) {
                        a.cursor++;
                        if (a.cursor == a.length) a.cursor = 0;
                        if (this.onskeepedaggregatedindexsetlast) {

                            a.data[a.cursor] = lastvalue;
                            //console.log(lastvalue);
                        }
                        else {
                            a.data[a.cursor] = undefined;
                        }
                    }
                    a.endX = x - 1;
                }
                this.updateStats(a);
            }
        },
        setCountBuffer: function (buffer) {
            this.countBuffer = buffer;
        },
        updateStats: function (timeline) {
            "use strict";

            // finding min, max and avg values
            var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, avg = 0, j, items = 0, v;
            for (j = 0; j < timeline.length; j++) {
                v = timeline.data[j];
                if (v !== undefined && timeline.cursor != j) {

                    // normalize by another stats
                    if (this.countBuffer !== undefined) v /= this.countBuffer.agregations[i].data[j];

                    min = Math.min(v, min);
                    max = Math.max(v, max);
                    avg = avg + v;
                    items++;
                }
            }
            if (items == 0) {
                max = 0;
                min = 0;
            }
            else avg /= (timeline.undefinedAsZero ? timeline.data.length : items);
            if (max == min) avg = min;

            timeline.global_min = timeline.min = min;
            timeline.global_max = timeline.max = max;
            timeline.avg = avg;
        },
        draw: function (ctx) {
            ctx.save();
            ctx.textAlign = "start";

            ctx.fillStyle = 'rgba(0,0,0,.6)';
            ctx.fillRect(0, 0, this.width, this.height);

            ctx.font = '11px Courier';
            ctx.strokeStyle = '#FFF';
            ctx.fillStyle = '#FFF';

            ctx.translate(this.padding_left, this.headheight);

            ctx.fillStyle = '#BBB';
            ctx.fillText(this.name, 0, 0);

            for (var i = 0; i < this.agregations.length; i++) {

                this.updateStats(i);
                var a = this.agregations[i]; // timeline

                ctx.fillStyle = '#888';
                ctx.fillText(friendlyNumber(a.max * this.statratio[i], 1), a.length + this.paddingStat, 0);

                ctx.fillStyle = '#FFF';
                ctx.fillText(friendlyNumber(a.avg * this.statratio[i], 1), a.length + this.paddingStat, 11);

                ctx.fillStyle = '#888';
                ctx.fillText(friendlyNumber(a.min * this.statratio[i], 1), a.length + this.paddingStat, 22);

                ctx.strokeStyle = '#FFF';
                ctx.beginPath();

                var newfloorheight = ((a.global_min > 2 || a.global_min < -2) ? 3 : a.global_min) | 0;
                this.height_item = this.height_item + this.floorheight - newfloorheight;
                this.floorheight = newfloorheight;

                var index = a.cursor - 1, j, v;
                for (j = 0; j < a.length; j++) {
                    index++;
                    if (index >= a.length) index = 0; // fix circle index
                    if (a.data[index] !== undefined && a.cursor != index) {

                        v = a.data[index];

                        // normalize by another stats
                        if (this.countBuffer !== undefined) v /= this.countBuffer.agregations[i].data[index];

                        v = (v - a.global_min) / (a.global_max - a.global_min);

                        if (a.global_max == a.global_min) v = 1;

                        var x = 0;
                        if (index < a.cursor) {
                            x = a.length - (a.cursor - index);
                        }
                        else {
                            x = index - a.cursor;
                        }

                        var t1 = (this.height_item * (1 - v)) | 0;
                        var t2 = this.height_item + this.floorheight;
                        if (t1 == t2 && v > 0) t1 -= 1;

                        ctx.moveTo(x + .5, this.padding_top + t1 + .5);
                        ctx.lineTo(x + .5, this.padding_top + t2 + .5);
                    }
                }
                ctx.closePath();
                ctx.stroke();
                ctx.strokeStyle = '#F00';
                ctx.beginPath();
                ctx.moveTo(a.length + .5, this.padding_top);
                ctx.lineTo(a.length + .5, this.padding_top + this.height_item + this.floorheight);
                ctx.closePath();
                ctx.stroke();
                ctx.translate(0, this.headheight + this.padding_top + this.height_item + this.floorheight);
            }

            ctx.restore();
        }
    };
    DataTimeBuffer.syncStats = function (timelines) {
        "use strict";
        var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, j, t;
        for (j = 0; j < timelines.length; j++) {
            t = timelines[j];
            min = Math.min(t.min, min);
            max = Math.max(t.max, max);
        }
        for (j = 0; j < timelines.length; j++) {
            t = timelines[j];
            t.global_min = min;
            t.global_max = max;
        }
    };

    module.DataTimeBuffer = DataTimeBuffer;
    module.friendlyNumber = friendlyNumber;
});
defineModule('MultiLayeredCanvas', ['DataTimeBuffer'], function (module, $r) {
    /**
     *  @overview MultiLayeredCanvas
     **/

    "use strict";

    var DataTimeBuffer = $r('DataTimeBuffer').DataTimeBuffer;

    window.requestAnimationFrame =
        window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame;

    var defaultInterval = 33;
    /**
     * Provides requestAnimationFrame in a cross browser way.
     */
    var requestAnimFrame = (function () {
        return function (/** @type function */ callback, /** @type HTMLElement */ element) {
            var lastTime = element.lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, defaultInterval - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.lastTime = currTime + timeToCall;
        };
    })();

    var MultiLayeredCanvas = function (canvasCount, parentNode) {
        var i;

        this.isDebugLog = true;
        this.width = 0;
        this.height = 0;
        this.cnvs = [];
        /**
         * contexts
         * @type {CanvasRenderingContext2D[]}
         */
        this.ctxs = [];
        this.isNeedLayersRedraw = [];
        this.canvasCount = canvasCount;
        this.canvasRatio = [];

        for (i = 0; i < this.canvasCount; i++) {
            this.cnvs[i] = document.getElementById('layer' + i);
            this.ctxs[i] = this.cnvs[i].getContext("2d");
            this.canvasRatio[i] = 1;
            this.isNeedLayersRedraw[i] = true;
            this['onDrawLayer' + i] = this['onDrawLayer' + i] ? this['onDrawLayer' + i] : (function (ctx, width, height) {
            });
        }

        this._isStoped = true;
        this._isStopAnimloop = true;
        this._loopHandlerBind = this._loopHandler.bind(this);
        this.minDeltaLoopInvoke = 5; // 16.6667; // 33 ms = 30 FPS // 16.6667 ~= 1000/60 (default framerate)

        this.canvasesParentElement = (parentNode === undefined) ? document.getElementById('canvasesdiv') : parentNode.querySelector(".canvasesdiv");
        this.rafElement = this.canvasesParentElement;//document.documentElement;
        this.clientBoundingElement = this.canvasesParentElement;//document.body;

        this._endlooptime = Date.now();
        this._startlooptime = Date.now();
        this._frameindex = 0;

        // timelines
        this._synctimelines = [];
        this._frames_timeline = new DataTimeBuffer([100, 1000], 100, "frames/second");
        this._frames_timeline.statratio = [10, 1];
        this._frames_timeline.agregations[1].undefinedAsZero = false;

        this._updatetime_frameline = new DataTimeBuffer([1], 100, "update", this._frameindex);
        this._looptime_frameline = new DataTimeBuffer([1], 100, "loop", this._frameindex);
        this._invoketime_frameline = new DataTimeBuffer([1], 100, "invoke", this._frameindex);
        this._totaltime_frameline = new DataTimeBuffer([1], 100, "total", this._frameindex);
        this._layerstime_frameline = [];

        this._synctimelines.push(
            this._updatetime_frameline.agregations[0],
            this._looptime_frameline.agregations[0],
            this._invoketime_frameline.agregations[0],
            this._totaltime_frameline.agregations[0]);

        for (i = 0; i < this.canvasCount; i++) {
            this._layerstime_frameline[i] = new DataTimeBuffer([1], 100, "layer" + i, this._frameindex);
            this._synctimelines.push(this._layerstime_frameline[i].agregations[0]);
        }
        // //

        // check resize vars
        this._checkResizeIntervalMilliseconds = 500;
        this._checkResizeIntervalFrames = 15;
        this._lastCheckedTime = Date.now();
        this._lastCheckedFrame = 0;

        document.addEventListener("visibilitychange", this._handlerVisibilityChange.bind(this), false);
        document.addEventListener("webkitvisibilitychange", this._handlerVisibilityChange.bind(this), false);
        this._handlerVisibilityChange();

        // window.addEventListener('resize', this._onResize.bind(this), false);
        //this._onResize();

        this._log('@ mc.constructor completed');
    };

    MultiLayeredCanvas.prototype._loopHandler = function () {
        if (this._isStopAnimloop === true) {
            this._isStoped = true;
            return;
        }

        /*
         var n = Date.now();
         if (((n - this._lastCheckedTime) > this._checkResizeIntervalMilliseconds)
         && ((this._frameindex - this._lastCheckedFrame) > this._checkResizeIntervalFrames)) {
         this._lastCheckedTime = n;
         this._lastCheckedFrame = this._frameindex;
         this._onResize();
         }
         */

        if (this.isVisible) {
            if ((Date.now() - this._startlooptime) >= this.minDeltaLoopInvoke) {
                this._loopLogic();
            }
        }

        requestAnimFrame(this._loopHandlerBind, this.rafElement);
    };
    MultiLayeredCanvas.prototype._loopLogic = function () {
        if (this._isStopAnimloop === true) {
            return;
        }
        var start;
        this._frameindex++;

        this._startlooptime = start = Date.now();
        var invokeDelta = this._startlooptime - this._endlooptime;
        this._invoketime_frameline.push(invokeDelta, this._frameindex);

        /**/
        var n = Date.now();
        if (((n - this._lastCheckedTime) > this._checkResizeIntervalMilliseconds)
            && ((this._frameindex - this._lastCheckedFrame) > this._checkResizeIntervalFrames)) {
            this._lastCheckedTime = n;
            this._lastCheckedFrame = this._frameindex;
            this._onResize();
        }
        /**/

        this.onUpdate(this);
        this._updatetime_frameline.push(Date.now() - start, this._frameindex);

        for (var i = this.canvasCount - 1; i > -1; i--) {
            if (this.isNeedLayersRedraw[i]) {
                start = Date.now();
                this['onDrawLayer' + i](this.ctxs[i], this.width, this.height, this.canvasRatio[i], i, this);
                this._layerstime_frameline[i].push(Date.now() - start, this._frameindex);
                this.isNeedLayersRedraw[i] = false;
            }
        }

        var looptime = Date.now() - this._startlooptime;
        this._looptime_frameline.push(looptime, this._frameindex);
        this._totaltime_frameline.push(looptime + invokeDelta, this._frameindex);
        this._frames_timeline.push(1);

        this._endlooptime = Date.now();
    };
    MultiLayeredCanvas.prototype.drawTimeline = function (ctx,w,h,r) {
        ctx.clearRect(0, 0, 148, 36 * (6 + this.canvasCount) - 5);
        var i;
        for (i = 0; i < this.canvasCount; i++) {
            this._layerstime_frameline[i].update(this._frameindex);
        }
        this._updatetime_frameline.update(this._frameindex);
        this._looptime_frameline.update(this._frameindex);
        this._invoketime_frameline.update(this._frameindex);
        this._totaltime_frameline.update(this._frameindex);
        DataTimeBuffer.syncStats(this._synctimelines);

        this._updatetime_frameline.draw(ctx);
        ctx.translate(0, 36);

        for (i = 0; i < this.canvasCount; i++) {
            this._layerstime_frameline[i].draw(ctx);
            ctx.translate(0, 36);
        }

        this._looptime_frameline.draw(ctx);
        ctx.translate(0, 36);

        this._invoketime_frameline.draw(ctx);
        ctx.translate(0, 36);

        this._totaltime_frameline.draw(ctx);
        ctx.translate(0, 36);

        this._frames_timeline.update();
        this._frames_timeline.draw(ctx);
    };

    /**
     * need to override logic in child class
     * @public
     */
    MultiLayeredCanvas.prototype.onUpdate = function (self) {
        for (var i = 0; i < this.canvasCount; i++) {
            this.isNeedLayersRedraw[i] = true;
        }
    };

    MultiLayeredCanvas.prototype.onChangePlayState = function (isPlay) { /*override*/
    };
    MultiLayeredCanvas.prototype.stop = function () {
        this._log('@ mc.stop invoked');
        if (this._isStopAnimloop === true) {
            return;
        }
        this._isStopAnimloop = true;
        this.onChangePlayState(!this._isStopAnimloop);
    };
    MultiLayeredCanvas.prototype.start = function () {
        this._log('@ mc.start invoked');
        if (this._isStopAnimloop === false) {
            return;
        }

        this._isStopAnimloop = false;
        this.onChangePlayState(!this._isStopAnimloop);
        if (this._isStoped === true) {
            this._isStoped = false;
            this._onResize();
            this._loopHandler();
        }
    };

    MultiLayeredCanvas.prototype.onChangeVisibility = function (isVisible) { /*override*/
    };
    MultiLayeredCanvas.prototype._handlerVisibilityChange = function () {
        this.isVisible = !(document.webkitHidden || document.hidden);
        this._log('@ mc.visibility: ' + this.isVisible);
        this.onChangeVisibility(this.isVisible);
        // (document.webkitVisibilityState != "prerender")
    };

    MultiLayeredCanvas.prototype.onPreResize = function (width, height) { /*override*/
    };
    MultiLayeredCanvas.prototype.onPostResize = function (width, height) { /*override*/
    };
    MultiLayeredCanvas.prototype.resize = function (width, height) {
        if (this.width === width && this.height === height) {
            return;
        }
        this.onPreResize(width, height);
        this._log('@ mc.resize from', this.width, this.height, 'to', width, height);
        for (var i = 0; i < this.canvasCount; i++) {
            this.cnvs[i].style.width = width;
            this.cnvs[i].style.height = height;
            this.cnvs[i].width = (width * this.canvasRatio[i]) | 0;
            this.cnvs[i].height = (height * this.canvasRatio[i]) | 0;
            this.isNeedLayersRedraw[i] = true;
        }
        this.width = width;
        this.height = height;
        if (this._isUseResizeFix) {
            this._resizeFix();
        }
        else {
            this.onPostResize(this.width, this.height);
        }
    };
    MultiLayeredCanvas.prototype._resizeFix = function () {
        this._isStopAnimloop = true;

        for (var i = 0; i < this.canvasCount; i++) {
            this.cnvs[i].width = this.cnvs[i].width;
        }

        var that = this;

        setTimeout(function () {

            that._log('@ mc.fix refresh canvases');
            for (var i = 0; i < that.canvasCount; i++) {
                that.cnvs[i].width = that.cnvs[i].width;
            }

            setTimeout(function () {
                that._log('@ mc.fix autostart');
                that._isStopAnimloop = false;
                if (that._isStoped === true) {
                    that._isStoped = false;
                    that._loopHandler();
                }
                that.onPostResize(that.width, that.height);
            }, 50);

        }, 500);
    };
    MultiLayeredCanvas.prototype._onResize = function () {
        //this._log('@ mc.check resize');
        var rect = this.clientBoundingElement.getBoundingClientRect();
        this.resize(rect.width, rect.height);
    };

    MultiLayeredCanvas.prototype._log = function () {
        if (this.isDebugLog === true) {
            console.log.apply(console, arguments);
        }
    };

    module.MultiLayeredCanvas = MultiLayeredCanvas;

});
defineModule('InputExtension', [], function (module) {

    /**
     *  @overview InputExtension
     **/

    'use strict';

    //http://jsperf.com/obj-vs-array-creator

    var Keys = {
        backspace: 8,
        tab: 9,
        enter: 13,
        shift: 16,
        ctrl: 17,
        alt: 18,
        pause_break: 19,
        caps_lock: 20,
        escape: 27,
        space: 32,
        page_up: 33,
        page_down: 34,
        end: 35,
        home: 36,
        left_arrow: 37,
        up_arrow: 38,
        right_arrow: 39,
        down_arrow: 40,
        insert: 45,
        delete: 46,
        0: 48,
        1: 49,
        2: 50,
        3: 51,
        4: 52,
        5: 53,
        6: 54,
        7: 55,
        8: 56,
        9: 57,
        a: 65,
        b: 66,
        c: 67,
        d: 68,
        e: 69,
        f: 70,
        g: 71,
        h: 72,
        i: 73,
        j: 74,
        k: 75,
        l: 76,
        m: 77,
        n: 78,
        o: 79,
        p: 80,
        q: 81,
        r: 82,
        s: 83,
        t: 84,
        u: 85,
        v: 86,
        w: 87,
        x: 88,
        y: 89,
        z: 90,
        left_window_key: 91,
        right_window_key: 92,
        select_key: 93,
        numpad_0: 96,
        numpad_1: 97,
        numpad_2: 98,
        numpad_3: 99,
        numpad_4: 100,
        numpad_5: 101,
        numpad_6: 102,
        numpad_7: 103,
        numpad_8: 104,
        numpad_9: 105,
        multiply: 106,
        add: 107,
        subtract: 109,
        decimal_point: 110,
        divide: 111,
        f1: 112,
        f2: 113,
        f3: 114,
        f4: 115,
        f5: 116,
        f6: 117,
        f7: 118,
        f8: 119,
        f9: 120,
        f10: 121,
        f11: 122,
        f12: 123,
        num_lock: 144,
        scroll_lock: 145,
        semi_colon: 186,
        equal_sign: 187,
        comma: 188,
        dash: 189,
        period: 190,
        forward_slash: 191,
        grave_accent: 192,
        open_bracket: 219,
        back_slash: 220,
        close_braket: 221,
        single_quote: 222
    };

    var KeysNameArray = [];
    for (var key in Keys) {
        KeysNameArray[Keys[key]] = key;
    }

    var In = {};
    /**
     *
     * @param targetElement
     * @param eventName  "mousemove", "mousedown", "mouseup",
     *                   "keyup", "keydown", "keypress",
     *                   "touchstart", "touchmove", "touchend",
     *                   "blur", "contextmenu", "DOMMouseScroll",
     *                   "click", "dblclick"
     * @param context
     * @param onEventHandler
     */
    In.subscribeOnEvent = function (targetElement, eventName, context, onEventHandler) {
        targetElement.addEventListener(eventName, function (e) {
            return onEventHandler.call(context, e);
        }, true);
    };
    In.getLocalPosition = function (e) {
        var posx = 0;
        var posy = 0;
        if (e === undefined) {
            e = window.event;
        }
        if (e.offsetX || e.offsetY) {
            posx = e.offsetX;
            posy = e.offsetY;
        }
        else if (e.layerX || e.layerY) {
            posx = e.layerX;
            posy = e.layerY;
        }
        else if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        return {x: posx, y: posy};
        //mouseX = e.clientX - theCanvas.offsetLeft;
        //mouseY = e.clientY - theCanvas.offsetTop;
    };
    In.getLocalPositionTouch = function (e) {
        var p = e.target.getBoundingClientRect();
        var t = 1;//document.width/screen.width;
        return {x: t * (e.pageX - p.left), y: t * (e.pageY - p.top)};
    };
    In.stopEvent = function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.returnValue = false;
        return false;
    };
    In.getChar = function (e) {
        // e.type должен быть keypress
        if (e.which == null) {
            return String.fromCharCode(e.keyCode); // IE
        }
        else if (e.which != 0 && e.charCode != 0) {
            return String.fromCharCode(e.which);   // остальные
        }
        else {
            return null; // специальная клавиша
        }
    };
    In.getDeltaWheel = function (e) {
        if (!e) e = window.event;
        var delta = 0;
        if (e.wheelDelta) {
            delta = e.wheelDelta / 120;
            if (window.opera) delta = -delta;
        }
        else if (e.detail) {
            delta = -e.detail / 3;
        }
        return delta;
    };
    In.getPointerOffset = function (e) {
        var pointer = navigator.pointer || navigator.webkitPointer;
        if (pointer) {
            pointer.isLocked = pointer.isLocked || pointer.islocked;
            var movementX = e.movementX || e.webkitMovementX;
            var movementY = e.movementY || e.webkitMovementY;

            if (pointer.isLocked && this.locked) {
                this.lockedX += movementX;
                this.lockedY += movementY;
            }
            else if (pointer.isLocked && this.locked == undefined) {
                this.lockedX = e.pageX;
                this.lockedY = e.pageY;
                this.locked = true;
            }
            else if (!pointer.isLocked && this.locked) {
                this.lockedX = e.pageX;
                this.lockedY = e.pageY;
                this.locked = undefined;
            }
            if (pointer.isLocked) {
                return {x: this.lockedX, y: this.lockedY};
            }
        }
        return {x: 0, y: 0};
    };

    var MouseTracker = function () {
        /**
         * Mouse state
         * @public
         */
        this.mouse = {
            lastDownX: -1,
            lastDownY: -1,
            lastX: -1,
            lastY: -1,
            lastUpX: -1,
            lastUpY: -1,

            lastDownRightX: -1,
            lastDownRightY: -1,
            lastDownMiddleX: -1,
            lastDownMiddleY: -1,
            lastDownLeftX: -1,
            lastDownLeftY: -1,

            lastUpRightX: -1,
            lastUpRightY: -1,
            lastUpMiddleX: -1,
            lastUpMiddleY: -1,
            lastUpLeftX: -1,
            lastUpLeftY: -1,

            isDown: false,
            isDownRight: false,
            isDownMiddle: false,
            isDownLeft: false
        };
        this.isChanged = false;
    };
    MouseTracker.prototype.onMouseMove = function (lp, event) {
        this.isChanged = true;

        var m = this.mouse;
        m.lastX = lp.x;
        m.lastY = lp.y;

        /*
         work only in chrome
         on mouse move ff and ie cant get real state of mouse button
         */
        /*if (event.which == 0){
         m.isDownRight = false;
         m.isDownMiddle = false;
         m.isDownLeft = false;
         m.isDown = false;
         return;
         }
         if ((event.which == 3) || (event.button == 2)) {
         m.isDownRight = true;
         }
         else{
         m.isDownRight = false;
         }
         if ((event.which == 2) || (event.button == 1)) {
         m.isDownMiddle = true;
         }
         else{
         m.isDownMiddle = false;
         }
         if ((event.which == 1) || (event.button == 0)) {
         m.isDownLeft = true;
         }
         else{
         m.isDownLeft = false;
         }
         if (!m.isDownLeft && !m.isDownMiddle && !m.isDownRight) {
         m.isDown = false;
         }*/
    };
    MouseTracker.prototype.onMouseDown = function (lp, event) {
        this.isChanged = true;

        var m = this.mouse;
        m.lastX = lp.x;
        m.lastY = lp.y;
        m.lastDownX = lp.x;
        m.lastDownY = lp.y;
        m.isDown = true;
        if ((event.which == 3) || (event.button == 2)) {
            m.isDownRight = true;
            m.lastDownRightX = lp.x;
            m.lastDownRightY = lp.y;
        }
        if ((event.which == 2) || (event.button == 1)) {
            m.isDownMiddle = true;
            m.lastDownMiddleX = lp.x;
            m.lastDownMiddleY = lp.y;
        }
        if ((event.which == 1) || (event.button == 0)) {
            m.isDownLeft = true;
            m.lastDownLeftX = lp.x;
            m.lastDownLeftY = lp.y;
        }
    };
    MouseTracker.prototype.onMouseUp = function (lp, event) {
        this.isChanged = true;

        var m = this.mouse;
        m.lastX = lp.x;
        m.lastY = lp.y;
        m.lastUpX = lp.x;
        m.lastUpY = lp.y;
        if ((event.which == 3) || (event.button == 2)) {
            m.isDownRight = false;
            m.lastUpRightX = lp.x;
            m.lastUpRightY = lp.y;
        }
        if ((event.which == 2) || (event.button == 1)) {
            m.isDownMiddle = false;
            m.lastUpMiddleX = lp.x;
            m.lastUpMiddleY = lp.y;
        }
        if ((event.which == 1) || (event.button == 0)) {
            m.isDownLeft = false;
            m.lastUpLeftX = lp.x;
            m.lastUpLeftY = lp.y;
        }
        if (!m.isDownLeft && !m.isDownMiddle && !m.isDownRight) {
            m.isDown = false;
        }
    };
    MouseTracker.prototype.onBlur = function () {
        this.isChanged = true;

        var m = this.mouse;
        var posx = m.lastX;
        var posy = m.lastY;
        m.lastUpX = posx;
        m.lastUpY = posy;
        if (m.isDownRight) {
            m.isDownRight = false;
            m.lastUpRightX = posx;
            m.lastUpRightY = posy;
        }
        if (m.isDownMiddle) {
            m.isDownMiddle = false;
            m.lastUpMiddleX = posx;
            m.lastUpMiddleY = posy;
        }
        if (m.isDownLeft) {
            m.isDownLeft = false;
            m.lastUpLeftX = posx;
            m.lastUpLeftY = posy;
        }
        m.isDown = false;
    };
    MouseTracker.prototype.drawMouseState = function (ctx) {

        var m = this.mouse;

        if (m.lastDownLeftX > 0) {
            ctx.fillStyle = 'rgba(255,150,150,.9)';
            ctx.beginPath();
            ctx.arc(m.lastDownLeftX, m.lastDownLeftY, 4, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        if (m.lastDownMiddleX > 0) {
            ctx.fillStyle = 'rgba(150,255,150,.9)';
            ctx.beginPath();
            ctx.arc(m.lastDownMiddleX, m.lastDownMiddleY, 4, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        if (m.lastDownRightX > 0) {
            ctx.fillStyle = 'rgba(150,150,255,.9)';
            ctx.beginPath();
            ctx.arc(m.lastDownRightX, m.lastDownRightY, 4, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        if (m.lastUpLeftX > 0) {
            ctx.fillStyle = 'rgba(255,0,0,.9)';
            ctx.beginPath();
            ctx.arc(m.lastUpLeftX, m.lastUpLeftY, 4, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        if (m.lastUpMiddleX > 0) {
            ctx.fillStyle = 'rgba(0,255,0,.9)';
            ctx.beginPath();
            ctx.arc(m.lastUpMiddleX, m.lastUpMiddleY, 4, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        if (m.lastUpRightX > 0) {
            ctx.fillStyle = 'rgba(0,0,255,.9)';
            ctx.beginPath();
            ctx.arc(m.lastUpRightX, m.lastUpRightY, 4, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        if (m.lastDownX > 0) {
            ctx.fillStyle = 'rgba(255,255,255,.5)';
            ctx.beginPath();
            ctx.arc(m.lastDownX, m.lastDownY, 15, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        if (m.lastUpX > 0) {
            ctx.fillStyle = 'rgba(255,255,255,.5)';
            ctx.beginPath();
            ctx.arc(m.lastUpX, m.lastUpY, 15, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        if (m.lastX > 0) {
            ctx.fillStyle = 'rgba(255,255,255,.4)';
            ctx.beginPath();
            ctx.arc(m.lastX, m.lastY, 20, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
            if (m.isDownRight > 0) {
                ctx.fillStyle = 'rgba(100,100,255,.6)';
                ctx.beginPath();
                ctx.arc(m.lastX, m.lastY, 20, 0 - Math.PI / 6, Math.PI * 2 / 3 - Math.PI / 6, false);
                ctx.closePath();
                ctx.fill();
            }
            if (m.isDownMiddle > 0) {
                ctx.fillStyle = 'rgba(100,255,100,.6)';
                ctx.beginPath();
                ctx.arc(m.lastX, m.lastY, 20, 2 * Math.PI * 2 / 3 - Math.PI / 6, Math.PI * 2 - Math.PI / 6, false);
                ctx.closePath();
                ctx.fill();
            }
            if (m.isDownLeft > 0) {
                ctx.fillStyle = 'rgba(255,100,100,.6)';
                ctx.beginPath();
                ctx.arc(m.lastX, m.lastY, 20, Math.PI * 2 / 3 - Math.PI / 6, 2 * Math.PI * 2 / 3 - Math.PI / 6, false);
                ctx.closePath();
                ctx.fill();
            }
        }

        this.isChanged = false;
    };

    var KeyboardTracker = function () {

        /**
         * keys status
         * @type {Array}
         * @public
         */
        this.keys = [];

        /**
         * pressed keys
         * @type {Array}
         */
        this.keyss = [];

        /**
         * time pressed keys
         * @type {Array}
         * @public
         */
        this.keytimes = [];

        /**
         * total time pressed keys
         * @type {Array}
         * @public
         */
        this.keypressedtimes = [];

        // init "keys" array
        for (var i = 0; i < 300; i++) {
            this.keypressedtimes[i] = 0;
        }

        this.handledKeyDownKeys = [
            Keys.left_arrow, Keys.right_arrow, Keys.up_arrow, Keys.down_arrow,
            Keys.w, Keys.a, Keys.s, Keys.d,
            Keys.tab , Keys.t, Keys.z, Keys.x, Keys.escape, Keys.space];

        this.onKeyChange = function(key, isPressed) {

        }
    };
    KeyboardTracker.prototype = {
        constructor: KeyboardTracker,
        setKeyChange: function (key, isPressed) {
            var now = Date.now();
            if (isPressed === false) {
                if (this.keys[key]) {
                    this.keys[key] = false;
                    this.keypressedtimes[key] += now - this.keytimes[key];
                    this.keyss.splice(this.keyss.indexOf(key), 1);
                    this.onKeyChange(key, false);
                }
            }
            else {
                if (this.keys[key] !== true) {
                    this.keys[key] = true;
                    this.keytimes[key] = Date.now();
                    this.keyss.push(key);
                    this.onKeyChange(key, true);
                }
            }
        },
        drawCurrentKeys: function (ctx, width, height) {
            var now = Date.now();
            var l = this.keyss.length;
            var dx = width - 148;
            var dy = height - 20 * l;

            ctx.fillStyle = 'rgba(0,0,0,.5)';
            ctx.fillRect(dx + 0, dy, 148, 20 * l);

            ctx.font = '11px Courier';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,.9)';

            for (var i = 0; i < l; i++) {
                var key = this.keyss[i];
                var y = 20 * (l - i - 1);
                ctx.textAlign = 'left';
                ctx.fillText(KeysNameArray[key], dx + 3, dy + 15 + y);
                ctx.textAlign = 'right';
                ctx.fillText(now - this.keytimes[key], dx + 148 - 3, dy + 15 + y);
            }
        },
        onBlur: function () {
            for (var key in this.keys) {
                if (this.keys.hasOwnProperty(key)) {
                    this.setKeyChange(key, false);
                }
            }
        },
        onKeyDown: function (e) {
            if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                for (var i = 0; i < this.handledKeyDownKeys.length; i++) {
                    if (e.keyCode == this.handledKeyDownKeys[i]) {
                        this.setKeyChange(e.keyCode, true);
                        return In.stopEvent(e);
                    }
                }
            }
            return true;
        },
        onKeyUp: function (e) {
            for (var i = 0; i < this.handledKeyDownKeys.length; i++) {
                if (e.keyCode == this.handledKeyDownKeys[i]) {
                    this.setKeyChange(e.keyCode, false);
                    return In.stopEvent(e);
                }
            }
            return true;
        },
        updateKeyboard: function () {
            var now = Date.now();
            for (var key in this.keys) {
                if (this.keys[key]) {
                    this.keypressedtimes[key] += now - this.keytimes[key];
                    this.keytimes[key] = now;
                }
            }
        }
    };

    var TouchesTracker = function () {
        this.touchesMove = {
            touches: [],
            changedTouches: [],
            targetTouches: []
        };
        this.touchesStart = {
            touches: [],
            changedTouches: [],
            targetTouches: []
        };
        this.touchesEnd = {
            touches: [],
            changedTouches: [],
            targetTouches: []
        };
        this.str = '';
        this.isChanged = false;
    };
    TouchesTracker.prototype.draw = function (ctx) {
        this._drawTouches(ctx, 0, 0, Math.PI * 2 / 3, Math.PI * 4 / 3, this.touchesMove, ["rgba(255,0,255,.2)", "rgba(255,0,255,.6)", "rgba(255,0,255,.8)"]);
        this._drawTouches(ctx, 0, 0, 0, Math.PI * 2 / 3, this.touchesStart, ["rgba(255,255,0,.2)", "rgba(255,255,0,.6)", "rgba(255,255,0,.8)"]);
        this._drawTouches(ctx, 0, 0, Math.PI * 4 / 3, Math.PI * 6 / 3, this.touchesEnd, ["rgba(0,255,255,.2)", "rgba(0,255,255,.6)", "rgba(0,255,255,.8)"]);

        ctx.fillStyle = 'rgba(150,150,150,0.7)';
        ctx.font = "18px helvetica";
        ctx.fillText(this.str, 150, 50);
    };
    TouchesTracker.prototype._drawTouches = function (ctx, dx, dy, a1, a2, s, colors) {
        var i, t;

        for (i = 0; i < s.touches.length; i++) {
            ctx.fillStyle = colors[0];
            t = s.touches[i];
            ctx.beginPath();
            ctx.arc(t.lp.x + dx, t.lp.y + dy, 40, a1, a2, false);
            ctx.lineTo(t.lp.x + dx, t.lp.y + dy);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(150,150,150,0.7)';
            ctx.font = "18px helvetica";
            ctx.fillText(t.id, t.lp.x + dx, t.lp.y + dy);
        }

        for (i = 0; i < s.changedTouches.length; i++) {
            ctx.fillStyle = colors[1];
            t = s.changedTouches[i];
            ctx.beginPath();
            ctx.arc(t.lp.x + dx, t.lp.y + dy, 30, a1, a2, false);
            ctx.lineTo(t.lp.x + dx, t.lp.y + dy);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(150,150,150,0.7)';
            ctx.font = "18px helvetica";
            ctx.fillText(t.id, t.lp.x + dx, t.lp.y + dy);
        }

        for (i = 0; i < s.targetTouches.length; i++) {
            ctx.fillStyle = colors[2];
            t = s.targetTouches[i];
            ctx.beginPath();
            ctx.arc(t.lp.x + dx, t.lp.y + dy, 20, a1, a2, false);
            ctx.lineTo(t.lp.x + dx, t.lp.y + dy);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(150,150,150,0.7)';
            ctx.font = "18px helvetica";
            ctx.fillText(t.id, t.lp.x + dx, t.lp.y + dy);
        }

        this.isChanged = false;

    };
    TouchesTracker.prototype._onTouch = function (event, s) {
        var i, t;
        s.touches = [];
        for (i = 0; i < event.touches.length; i++) {
            t = event.touches[i];
            s.touches[i] = {lp: In.getLocalPositionTouch(t), id: t.identifier};
        }
        s.changedTouches = [];
        for (i = 0; i < event.changedTouches.length; i++) {
            t = event.changedTouches[i];
            s.changedTouches[i] = {lp: In.getLocalPositionTouch(t), id: t.identifier};
        }
        s.targetTouches = [];
        for (i = 0; i < event.targetTouches.length; i++) {
            t = event.targetTouches[i];
            s.targetTouches[i] = {lp: In.getLocalPositionTouch(t), id: t.identifier};
        }
        this.isChanged = true;
    };
    TouchesTracker.prototype.onTouchMove = function (event) {
        this._onTouch(event, this.touchesMove);
        var o = event.touches[0];
        var lp = In.getLocalPositionTouch(o);
        this.str = lp.x + ',' + lp.y;
    };
    TouchesTracker.prototype.onTouchStart = function (event) {
        this._onTouch(event, this.touchesStart);
    };
    TouchesTracker.prototype.onTouchEnd = function (event) {
        this._onTouch(event, this.touchesEnd);
        if (this.touchesEnd.touches.length === 0) {
            this.str = '';
        }
    };

    module.In = In;
    module.MouseTracker = MouseTracker;
    module.KeyboardTracker = KeyboardTracker;
    module.TouchesTracker = TouchesTracker;
    module.Keys = Keys;
    module.KeysNameArray = KeysNameArray;

});
defineModule('CanvasDebugShape', ['InputExtension'], function (module, $r) {
    /**
     *  @overview CanvasDebugShape
     **/

    "use strict";

    var In = $r('InputExtension').In;
    var MouseTracker = $r('InputExtension').MouseTracker;
    var TouchesTracker = $r('InputExtension').TouchesTracker;

    var CanvasDebugShape = function (canvasesParentElement) {

        var mt = this.mt = new MouseTracker();
        var tt = this.tt = new TouchesTracker();

        this._onMouseMove = function (e) {
            var lp = In.getLocalPosition(e);
            mt.onMouseMove(lp, e);
        };
        this._onMouseUp = function (e) {
            var lp = In.getLocalPosition(e);
            mt.onMouseUp(lp, e);
        };
        this._onMouseDown = function (e) {
            var lp = In.getLocalPosition(e);
            mt.onMouseDown(lp, e);
        };
        this._onBlur = function (e) {
            console.log('onBlur');
            mt.onBlur();
        };
        this._onTouchStart = function (e) {
            tt.onTouchStart(e);
        };
        this._onTouchEnd = function (e) {
            tt.onTouchEnd(e);
        };
        this._onTouchMove = function (e) {
            tt.onTouchMove(e);
        };
        In.subscribeOnEvent(canvasesParentElement, 'mousemove', this, this._onMouseMove);
        In.subscribeOnEvent(canvasesParentElement, 'mouseup', this, this._onMouseUp);
        In.subscribeOnEvent(canvasesParentElement, 'mousedown', this, this._onMouseDown);
        In.subscribeOnEvent(canvasesParentElement, 'touchstart', this, this._onTouchStart);
        In.subscribeOnEvent(canvasesParentElement, 'touchend', this, this._onTouchEnd);
        In.subscribeOnEvent(canvasesParentElement, 'touchmove', this, this._onTouchMove);
        In.subscribeOnEvent(window, "blur", this, this._onBlur);

        this.isDirty = function () {
            return (tt.isChanged || mt.isChanged);
        };
        this.draw = function (ctx, w, h, r) {
            ctx.setTransform(r, 0, 0, r, 0, 0);
            mt.drawMouseState(ctx);
            ctx.setTransform(r, 0, 0, r, 0, 0);
            tt.draw(ctx);
        };
    };

    module.CanvasDebugShape = CanvasDebugShape;
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
defineModule('Transformations', [], function (module) {
    /**
     * @overview Transformations module.
     * @copyright Terebus Volodymyr 2012
     */

    "use strict";

    /**
     *  Simple natrix operations
     */
    var Transformator = {
        /**
         * get the product matrix and point
         * @param {Number[]} m
         * @param {Number[]} p
         * @return {Number[]}
         */
        direct: function (m, p) {
            return [
                p[0] * m[0] + p[1] * m[2] + m[4],
                p[0] * m[1] + p[1] * m[3] + m[5]
            ];
        },
        /**
         * get the product invert matrix and point
         * @param {Number[]} m
         * @param {Number[]} p
         * @return {Number[]}
         */
        invers: function (m, p) {
            var d = m[0] * m[3] - m[1] * m[2];
            if (d === 0) {
                throw new Error('incorrect matrix', m);
            }
            d = 1 / d;
            var r = [p[0] - m[4], p[1] - m[5]];
            return [
                (r[0] * m[3] - r[1] * m[2]) * d,
                (r[1] * m[0] - r[0] * m[1]) * d
            ];
        },
        /**
         * get the product of two matrix
         * @param {Number[]} m
         * @param {Number[]} k
         * @return {Number[]}
         */
        multiplyMatrix: function (m, k) {
            var m11 = m[0] * k[0] + m[2] * k[1];
            var m12 = m[1] * k[0] + m[3] * k[1];

            var m21 = m[0] * k[2] + m[2] * k[3];
            var m22 = m[1] * k[2] + m[3] * k[3];

            var dx = m[0] * k[4] + m[2] * k[5] + m[4];
            var dy = m[1] * k[4] + m[3] * k[5] + m[5];

            return [m11, m12, m21, m22, dx, dy];
        },
        /**
         * get invert matrix
         * @param {Number[]} m
         * @param {Number[]} target_m
         */
        invertMatrix: function (m, target_m) {
            var d = m[0] * m[3] - m[1] * m[2];
            if (d === 0) {
                throw new Error('incorrect matrix', m);
            }
            d = 1 / d;
            var m0 = m[3] * d;
            var m1 = -m[1] * d;
            var m2 = -m[2] * d;
            var m3 = m[0] * d;
            var m4 = d * (m[2] * m[5] - m[3] * m[4]);
            var m5 = d * (m[1] * m[4] - m[0] * m[5]);
            target_m[0] = m0;
            target_m[1] = m1;
            target_m[2] = m2;
            target_m[3] = m3;
            target_m[4] = m4;
            target_m[5] = m5;
        }
    };

    /**
     * Transform 2d
     * mutable object
     * @constructor
     * @class Transform
     */
    var Transform = function Transform () {
        this.m = [1, 0, 0, 1, 0, 0];
    };
    Transform.prototype.reset = function () {
        this.m[0] = 1;
        this.m[1] = 0;
        this.m[2] = 0;
        this.m[3] = 1;
        this.m[4] = 0;
        this.m[5] = 0;
        return this;
    };
    Transform.prototype.rotate = function (rad) {
        if (rad === 0)  return this;
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var m11 = this.m[0] *  c + this.m[1] *  s;
        var m12 = this.m[0] * -s + this.m[1] *  c;
        var m21 = this.m[2] *  c + this.m[3] *  s;
        var m22 = this.m[2] * -s + this.m[3] *  c;
        var m31 = this.m[4] *  c + this.m[5] *  s;
        var m32 = this.m[4] * -s + this.m[5] *  c;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
        this.m[4] = m31;
        this.m[5] = m32;
        return this;
    };
    Transform.prototype.translate = function (x, y) {
        this.m[4] += x;
        this.m[5] += y;
        return this;
    };
    Transform.prototype.scale = function (sx, sy) {
        this.m[0] *= sx;
        this.m[1] *= sy;
        this.m[2] *= sx;
        this.m[3] *= sy;
        this.m[4] *= sx;
        this.m[5] *= sy;
        return this;
    };
    Transform.prototype.init = function (rad, scale, dx, dy){
        "use strict";
        // new Transform().rotate(rad).scale(scale, scale).translate(dx, dy)
        var c = scale * Math.cos(rad);
        var s = scale * Math.sin(rad);
        this.m[0] = c;
        this.m[1] = -s;
        this.m[2] = s;
        this.m[3] = c;
        this.m[4] = dx;
        this.m[5] = dy;
        return this;
    };
    Transform.prototype.zoomAt = function (zoomX, zoomY, centerX, centerY) {
        this.m[0] *= zoomX;
        this.m[1] *= zoomY;
        this.m[2] *= zoomX;
        this.m[3] *= zoomY;
        this.m[4] = zoomX * (this.m[4] - centerX) + centerX;
        this.m[5] = zoomY * (this.m[5] - centerY) + centerY;
        return this;
    };
    Transform.prototype.getPoint = function (x, y) {
        return Transformator.direct(this.m, [x, y]);
    };
    Transform.prototype.getInvertPoint = function (x, y) {
        return Transformator.invers(this.m, [x, y]);
    };

    /**
     * View Transformation
     * @constructor
     * @class ViewTransformation
     */
    var ViewTransformation = function ViewTransformation () {
        "use strict";

        this._normalmatrix = new Transform();
        this._invertmatrix = new Transform();
        this._changed = false;
        this._scale = 1;
        this._angle = 0;
        this._offsetX = 0;
        this._offsetY = 0;
    };
    Object.defineProperties(ViewTransformation.prototype, {
        "scale": {
            get: function () {
                return this._scale;
            },
            set: function (value) {
                this._scale = value;
                this._changed = true;
            }
        },
        "angle": {
            get: function () {
                return this._angle;
            },
            set: function (value) {
                this._angle = value;
                this._changed = true;
            }
        },
        "offsetX": {
            get: function () {
                return this._offsetX;
            },
            set: function (value) {
                this._offsetX = value;
                this._changed = true;
            }
        },
        "offsetY": {
            get: function () {
                return this._offsetY;
            },
            set: function (value) {
                this._offsetY = value;
                this._changed = true;
            }
        },
        "matrix": {
            get: function () {
                this.updateTransform();
                return this._normalmatrix;
            }
        }
    });
    /**
     * get transform point
     * @param {Number} x
     * @param {Number} y
     * @return {Number[]}
     */
    ViewTransformation.prototype.getPoint = function (x, y) {
        return Transformator.direct(this._normalmatrix.m, [x, y]);
    };
    /**
     * get point from transform point
     * @param {Number} x
     * @param {Number} y
     * @return {Number[]}
     */
    ViewTransformation.prototype.getInvertPoint = function (x, y) {
        return Transformator.direct(this._invertmatrix.m, [x, y]);
    };
    /**
     * translate
     * @param {Number} dx
     * @param {Number} dy
     */
    ViewTransformation.prototype.translate = function (dx, dy) {
        this._offsetX += dx;
        this._offsetY += dy;
        this._changed = true;
    };
    /**
     * zoom
     * @param {Number} zoom
     * @param {Number[]} zoomPoint
     */
    ViewTransformation.prototype.zoom = function (zoom, zoomPoint) {
        this._scale *= zoom;
        this._offsetX = zoom * (this._offsetX - zoomPoint[0]) + zoomPoint[0];
        this._offsetY = zoom * (this._offsetY - zoomPoint[1]) + zoomPoint[1];
        this._changed = true;
    };
    ViewTransformation.prototype.onSizeChainged = function (newSize, previousSize) {
        this._offsetX += (newSize.Width - previousSize.Width) / 2;
        this._offsetY += (newSize.Height - previousSize.Height) / 2;
        this._changed = true;
    };
    ViewTransformation.prototype.updateTransform = function () {
        if (!this._changed) {
            return;
        }
        this._changed = false;
        this._normalmatrix.init(this._angle, this._scale, this._offsetX, this._offsetY);

        Transformator.invertMatrix(this._normalmatrix.m, this._invertmatrix.m);
    };
    ViewTransformation.prototype.rotate = function (rad, w, h) {
        var c = Math.cos(rad - this.angle);
        var s = Math.sin(rad - this.angle);
        var dx = (this._offsetX - w) * c + (this._offsetY - h) * s + w;
        var dy = (this._offsetX - w) * -s + (this._offsetY - h) * c + h;
        this._offsetX = dx;
        this._offsetY = dy;
        this.angle = rad;
    };

    /**
     * Camera Target
     * @param {Number} width
     * @param {Number} height
     * @constructor
     * @class CameraTarget
     */
    var CameraTarget = function CameraTarget (width, height) {
        this.width = width;
        this.height = height;
        this.viewport = [0, 0, this.width, this.height];
        this.transform = new Transform();
        this.transform.translate(this.viewport[2] >> 1, this.viewport[3] >> 1);
        this.deltax = 0;
        this.deltay = 0;
        this.scalex = 1;
        this.scaley = 1;
    };
    CameraTarget.prototype.updateViewPortManual = function (cx, cy, x, y) {
        this.transform.reset();
        this.transform.translate(-cx, -cy);
        this.transform.translate(this.viewport[2] >> 1, this.viewport[3] >> 1);
    };
    CameraTarget.prototype.updateMouseLook = function (mouse) {
        var ndelayx = 0.3 * (mouse.lastX - (this.viewport[2] >> 1)) / this.scalex;
        var ndelayy = 0.3 * (mouse.lastY - (this.viewport[3] >> 1)) / this.scaley;
        var k1 = 0.9;
        var k2 = 0.1;
        this.deltax = k1 * ndelayx + k2 * this.deltax;
        this.deltay = k1 * ndelayy + k2 * this.deltay;
        this.deltax = (this.deltax + 0.5) | 0;
        this.deltay = (this.deltay + 0.5) | 0;
        this.transform.translate(-this.deltax, -this.deltay);
    };
    CameraTarget.prototype.resize = function (width, height) {
        this.width = width;
        this.height = height;
        this.viewport[2] = width;
        this.viewport[3] = height;
    };
    CameraTarget.prototype.getWorldBound = function () {
        var p1 = this.transform.getInvertPoint(0, 0);
        var p2 = this.transform.getInvertPoint(this.width, this.height);
        return [p1[0], p1[1], p2[0], p2[1]];
    };

    /**
     * TouchContainer
     * @param {Number} scrX
     * @param {Number} scrY
     * @param {ViewTransformation} viewTansformation
     * @constructor
     * @class TouchContainer
     */
    var TouchContainer = function TouchContainer (scrX, scrY, viewTansformation) {
        this.viewTansformation = viewTansformation;
        this.startScrP = [scrX, scrY];
        this.realP = viewTansformation.getInvertPoint(scrX, scrY);
        this.zoom = 1;
        this.lposx = scrX;
        this.lposy = scrY;
    };
    TouchContainer.prototype.onMove = function (posx, posy) {
        this.lposx = posx;
        this.lposy = posy;
    };
    TouchContainer.prototype.onScale = function (zoom) {
        this.zoom *= zoom;
    };
    TouchContainer.prototype.updateViewPort = function () {
        var t4 = this.viewTansformation.getPoint(this.realP[0], this.realP[1]);
        this.viewTansformation.zoom(this.zoom, t4);
        this.viewTansformation.translate((this.lposx - t4[0]) * this.zoom, (this.lposy - t4[1]) * this.zoom);
        this.viewTansformation.updateTransform();
        this.zoom = 1;
    };
    TouchContainer.prototype.grabLength = function (scrX, scrY) {
        var dx = (this.startScrP[0] - scrX);
        var dy = (this.startScrP[1] - scrY);
        return Math.sqrt(dx * dx + dy * dy);
    };

    /**
     * CellsVisibility
     * @constructor
     * @class CellsVisibility
     */
    var CellsVisibility = function CellsVisibility () {
        "use strict";
        this.viewport = [0, 0, 1, 1];
        this.bound = [[0,0],[1,1]];
        this.indexbound = [[0,0],[1,1]];
        this._docomplex = false;
    };
    /**
     * update
     * @param {ViewTransformation} transform
     * @param {Number} w
     * @param {Number} h
     * @param {Number} d
     */
    CellsVisibility.prototype.update = function (transform, w, h, d) {
        "use strict";

        var p1 = transform.getInvertPoint(0, 0);
        var p2 = transform.getInvertPoint(w, h);
        var p3 = transform.getInvertPoint(0, h);
        var p4 = transform.getInvertPoint(w, 0);
        var minx = p1[0],
            miny = p1[1],
            maxx = p1[0],
            maxy = p1[1];

        var pp = this.viewport = [p1, p3, p2, p4];

        for (var i = 1; i < 4; i++) {
            if (minx > pp[i][0]) minx = pp[i][0];
            if (maxx < pp[i][0]) maxx = pp[i][0];
            if (miny > pp[i][1]) miny = pp[i][1];
            if (maxy < pp[i][1]) maxy = pp[i][1];
        }
        this.bound = [[minx,miny],[maxx,maxy]];

        var k = transform.angle / (Math.PI/2);
        var k2 = transform.angle - (k|0)* (Math.PI/2);
        this._docomplex = Math.abs(k2) > 1e-10;

        if (this._docomplex) {
            var nn = [];
            nn.push(this._getConstraints(pp[0][0], pp[0][1], pp[1][0], pp[1][1], d));
            nn.push(this._getConstraints(pp[1][0], pp[1][1], pp[2][0], pp[2][1], d));
            nn.push(this._getConstraints(pp[2][0], pp[2][1], pp[3][0], pp[3][1], d));
            nn.push(this._getConstraints(pp[3][0], pp[3][1], pp[0][0], pp[0][1], d));
            this.nn = nn;
        }
        var q = this.bound;
        this.indexbound = [
            [Math.floor(q[0][0] / d), Math.floor(q[0][1] / d)],
            [Math.floor(q[1][0] / d), Math.floor(q[1][1] / d)]
        ];
    };
    /**
     * iterate for each that are visible
     * @param {Function(Number,Number)} cb - callback with arguments i and j
     */
    CellsVisibility.prototype.forEachVisible = function (cb) {
        "use strict";

        var i, j, ib = this.indexbound;

        if (this._docomplex) {
            var k,
                t = true,
                nn = this.nn,
                nl = nn.length;

            for (i = ib[0][0]; i <= ib[1][0]; i++) {
                for (j = ib[0][1]; j <= ib[1][1]; j++) {
                    t = true;
                    for (k = 0; k < nl; k++) {
                        if (nn[k][0] * i + nn[k][1] * j + nn[k][2] > 0) {
                            // if (nx * i + ny * j + _r > 0)
                            t = false;
                            break;
                        }
                    }
                    if (t) {
                        cb(i, j);
                    }
                }
            }
        }
        else {
            for (i = ib[0][0]; i <= ib[1][0]; i++) {
                for (j = ib[0][1]; j <= ib[1][1]; j++) {
                    cb(i, j);
                }
            }
        }
    };
    /**
     * isVisible
     * @param {Number} i
     * @param {Number} j
     * @return {Boolean}
     */
    CellsVisibility.prototype.isVisible = function (i, j) {
        "use strict";
        var ib = this.indexbound;

        if (this._docomplex) {
            var k,
                nn = this.nn,
                nl = nn.length;

            if (i >= ib[0][0] && i <= ib[1][0] &&
                j >= ib[0][1] && j <= ib[1][1]) {
                for (k = 0; k < nl; k++) {
                    if (nn[k][0] * i + nn[k][1] * j + nn[k][2] > 0) {
                        // if (nx * i + ny * j + _r > 0)
                        return false;
                    }
                }
                return true;
            }
        }
        else {
            if (i >= ib[0][0] && i <= ib[1][0] &&
                j >= ib[0][1] && j <= ib[1][1]) {
                return true;
            }
        }
        return false;
    };
    CellsVisibility.prototype._getConstraints = function (x0, y0, x1, y1, d) {
        "use strict";

        var nx = y0 - y1,
            ny = x1 - x0;

        var ox = (nx <= 0) ? d : 0,
            oy = (ny <= 0) ? d : 0;

        var r = (nx * (ox - x0) + ny * (oy - y0)) / d;

        return [nx, ny, r];
    };

    module.Transformator = Transformator;
    module.Transform = Transform;
    module.ViewTransformation = ViewTransformation;
    module.CameraTarget = CameraTarget;
    module.TouchContainer = TouchContainer;
    module.CellsVisibility = CellsVisibility;
});
defineModule('puzzle-core', ['Transformations'], function (module, $r) {

    /**
     *  @overview puzzle core
     **/

    'use strict';

    var Transform = $r('Transformations').Transform;

    var SimpleShape = function (x, y, w, h, drawerFunc) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx = this.canvas.getContext("2d");
        this.w = w;
        this.h = h;
        this.x = x;
        this.y = y;
        this.isNeedRefresh = true;
        this.autoRefresh = false;
        this.drawerFunc = drawerFunc;
    };
    /**
     * draw shape
     * @param {CanvasRenderingContext2D} [ctx]
     */
    SimpleShape.prototype.draw = function (ctx) {
        if (this.isNeedRefresh) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.w, this.h);
            this.ctx.save();
            this.drawerFunc(this.ctx);
            this.ctx.restore();

            if (!this.autoRefresh) {
                this.isNeedRefresh = false;
            }
        }
        if (ctx !== undefined)
            ctx.drawImage(this.canvas, this.x, this.y, this.w, this.h);
    };

    var GeometryHelper = {
        /**
         * is intersect Rectangles?
         * @param {number} x0
         * @param {number} y0
         * @param {number} w0
         * @param {number} h0
         * @param {number} x1
         * @param {number} y1
         * @param {number} w1
         * @param {number} h1
         * @returns {boolean}
         */
        isIntersectRectangles: function (x0, y0, w0, h0, x1, y1, w1, h1) {
            return !(((x0 + w0) < x1) || ((x1 + w1) < x0) || ((y0 + h0) < y1) || ((y1 + h1) < y0));
        }
    };

    function sign(x) {
        return x ? x < 0 ? -1 : 1 : 0;
    }

    /**
     * get random interger by range
     * @param {int} min
     * @param {int} max
     * @returns {int}
     */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    /**
     * drag two touches
     * @param {number} xa0
     * @param {number} ya0
     * @param {number} xa1
     * @param {number} ya1
     * @param {number} xb0
     * @param {number} yb0
     * @param {number} xb1
     * @param {number} yb1
     * @param {ViewTransformation} viewTransform
     * @param {boolean} scalable
     * @param {boolean} rotatable
     */
    function dragTwoTouches(xa0, ya0, xa1, ya1, xb0, yb0, xb1, yb1, viewTransform, scalable, rotatable) {

        var dxa = xa1 - xa0;
        var dya = ya1 - ya0;
        var dxb = xb1 - xb0;
        var dyb = yb1 - yb0;
        viewTransform.translate(xb0 - xa0, yb0 - ya0);

        if (scalable) {
            var da = Math.sqrt(dxa * dxa + dya * dya);
            var db = Math.sqrt(dxb * dxb + dyb * dyb);
            var zoom = db / da;
            if (zoom > 1.005 || zoom < 0.995) {
                var newScale = viewTransform.scale * zoom;
                if (newScale < 0.75) {
                    zoom = 0.75 / viewTransform.scale;
                }
                if (newScale > 1.25) {
                    zoom = 1.25 / viewTransform.scale;
                }
                viewTransform.zoom(zoom, [xb0, yb0]);
            }
        }

        if (rotatable) {
            var cos_dAlpha = (dxa * dxb + dya * dyb);// / (da * db); //ru.wikipedia.org/wiki/Скалярное_произведение_векторов
            var sin_dAlpha = (dxa * dyb - dya * dxb);// / (da * db); //ru.wikipedia.org/wiki/Псевдоскалярное_произведение
            var dAlpha = Math.atan2(sin_dAlpha, cos_dAlpha);
            if (dAlpha > 0.005 || dAlpha < -0.005) {
                viewTransform.rotate(viewTransform.angle - dAlpha, xb0, yb0);
            }
        }

        viewTransform.updateTransform();
    }


    function dragOneTouches(xa, ya, xb, yb, viewTransform) {

        var dx = xb - xa;
        var dy = yb - ya;

        if (Math.abs(dx) * 20 < Math.abs(dy)) {
            dx = 0;
        }
        else if (Math.abs(dy) * 20 < Math.abs(dx)) {
            dy = 0;
        }

        viewTransform.translate(dx, dy);

        viewTransform.updateTransform();
    }


    /**
     * Waiter
     * @param {int} milliseconds
     * @param {Function} timeout_callbackFunction
     * @param {Function} [callbackFunction]
     * @constructor
     * @class Waiter
     */
    var Waiter = function (milliseconds, timeout_callbackFunction, callbackFunction) {
        this._waitSecondTouch_id = setTimeout(this._timeoutFire.bind(this), milliseconds);
        this._timeout_callbackFunction = timeout_callbackFunction;
        this._callbackFunction = callbackFunction;
        this.fired = false;
        this.canceled = false;
    };
    Waiter.prototype = {
        constructor: Waiter,
        cancel: function () {
            if (this.fired === true) return false;
            if (this.canceled === false) {
                this.canceled = true;
                clearTimeout(this._waitSecondTouch_id);
                this._waitSecondTouch_id = -1;
                if (this._callbackFunction !== undefined) {
                    this._callbackFunction();
                }
            }
            return true;
        },
        _timeoutFire: function () {
            if (this.canceled === false && this.fired == false) {
                this.fired = true;
                this._timeout_callbackFunction();
                this._waitSecondTouch_id = -1;
            }
        },
        force: function () {
            if (this.fired === true || this.canceled === true) return false;
            this.fired = true;
            this._timeout_callbackFunction();
            clearTimeout(this._waitSecondTouch_id);
            this._waitSecondTouch_id = -1;
            return true;
        }
    };

    var PuzzleI = function () {
        /**
         * чи перевіряти чи стикуються елементи пазла між собою?
         * @type {boolean}
         */
        this.checkPositionsForEachOtherElemets = true;
        /**
         * кількість елементів пазла
         * @type {int}
         */
        this.elementsCount = 0;
        /**
         * масив алементів пазла
         * @type {PuzzleElement[]}
         */
        this.elements = [];
        /**
         * множина вже приєднаних елементів до доски
         * @type {PuzzleElement[]}
         */
        this.connected = [this];

        this.prevZindex = -1;
        this.scale = 1;
        this.angle = 0;// Math.PI / 10;
        this.position = {x: 0, y: 0};//{x: 300, y: 10};
        this.target = {x: 0, y: 0};
        this.origin = {x: 0, y: 0};

        /**
         * набіри колекції зєднаних елементів пазла та їхніній SimpleShape
         * @type {Array}
         */
        this.sets = [];

        /**
         * радіус в пікселях де шукаємо перекриття з маскою
         * @type {number}
         */
        this.pixelCollisionRadius = 10;

        this.elementsSet = {elements: [this], shape: null};
        this.shape = new SimpleShape(0, 0, 1, 1, function () {
        });
    };
    PuzzleI.prototype = {
        constructor: PuzzleI,

        restart: function () {

        },

        init: function (config) {
            var i, j, index;
            var k = this.k = config.k;
            var kx = this.kx = config.kx;
            var ky = this.ky = config.ky;
            this.image = config.image;
            this.elementsCount = kx * ky;

            for (i = 0; i < kx; i++) {
                for (j = 0; j < ky; j++) {
                    index = i * ky + j;
                    this.elements[index] = new PuzzleElement(
                        {
                            ix: i,
                            iy: j,
                            index: index,
                            target: {
                                x: i * k,
                                y: j * k
                            },
                            position: {
                                x: (kx - i - 1) * k,
                                y: (ky - j - 1) * k
                            },
                            bound: {
                                x: -k / 2,
                                y: -k / 2,
                                w: 2 * k,
                                h: 2 * k
                            },
                            game: this
                        }
                    );
                }
            }

            var p = [], f;
            for (i = 0; i < kx; i++) {
                for (j = 0; j < ky; j++) {
                    index = i * ky + j;
                    var x, y;
                    do {
                        x = getRandomInt(-1.5 * k, 1.5 * k * kx);
                        y = getRandomInt(-1.5 * k, 1.5 * k * ky);
                        f = false;
                        for (var ii = 0; ii < p.length; ii++) {
                            if ((p[ii][0] - x) * (p[ii][0] - x) + (p[ii][1] - y) * (p[ii][1] - y) < k * k) {
                                f = true;
                                break;
                            }
                        }
                    }
                    while ((((x > -k && x < (kx) * k) && (y > -k && y < (ky) * k))) || f == true);

                    p.push([x, y]);
                    this.elements[index].position.x = x;

                    this.elements[index].position.y = y;
                }
            }

            // задаємо сусідів (зверху, знизу, справа, зліва)
            for (i = 0; i < kx; i++) {
                for (j = 0; j < ky; j++) {
                    var n = this.elements[i * ky + j].neighborhood;
                    //if (i > 0 && j > 0) n.push(this.elements[(i - 1) * ky + (j - 1)]);
                    if (j > 0) n.push(this.elements[(i) * ky + (j - 1)]);
                    //if (i < (kx - 1) && j > 0) n.push(this.elements[(i + 1) * ky + (j - 1)]);
                    //if (i > 0 && j < (ky - 1)) n.push(this.elements[(i - 1) * ky + (j + 1)]);
                    if (j < (ky - 1)) n.push(this.elements[(i) * ky + (j + 1)]);
                    //if (i < (kx - 1) && j < (ky - 1)) n.push(this.elements[(i + 1) * ky + (j + 1)]);
                    if (i > 0) n.push(this.elements[(i - 1) * ky + (j)]);
                    if (i < (kx - 1)) n.push(this.elements[(i + 1) * ky + (j)]);
                }
            }

            for (i = 0; i < kx - 1; i++) {
                for (j = 0; j < ky; j++) {
                    var t = ['', 'i', 'm', 'mi'];
                    var key = getRandomInt(1, 2).toString() + t[getRandomInt(0, 3)];

                    this.elements[i * ky + j].right = key;
                    this.elements[(i + 1) * ky + j].left = key;
                }
            }
            for (i = 0; i < kx; i++) {
                for (j = 0; j < ky - 1; j++) {

                    var t = ['', 'i', 'm', 'mi'];
                    var key = getRandomInt(1, 2).toString() + t[getRandomInt(0, 3)];

                    this.elements[i * ky + j].bottom = key;
                    this.elements[i * ky + j + 1].top = key;
                }
            }

            for (i = 0; i < this.elements.length; i++) {

                var el = this.elements[i];

                el.prevZindex = i;

                el.game = this;
                var elementsSet = {elements: [el], shape: null};
                el.elementsSet = elementsSet;
                this.sets.push(elementsSet);
            }

            this.shape = new SimpleShape(-10, -10, kx * k + 20, ky * k + 20, this._drawerBoard.bind(this));

            PuzzleStuff.generateAllPossibleEdge(this.k * 1);
        },

        /**
         * отримати верхній елемент пазла в заданих координатах
         * @param {Number} x
         * @param {Number} y
         * @returns {*}
         */
        getOverElementAtPosition: function (x, y) {

            // проходимо в зворотньому порядку (з передніх до задніх)
            for (var i = this.elements.length - 1; i >= 0; i--) {
                var checkElement = this.elements[i];
                var res = checkElement.checkOver(x, y);
                if (res !== false) {
                    return {
                        element: checkElement,
                        context: {
                            localPoint: res.localPoint,
                            startScreen: {x: x, y: y},
                            startPosition: {x: checkElement.position.x, y: checkElement.position.y}
                        }
                    };
                }
            }
            return null;
        },

        /**
         * знайти наближчий підходящий елемент до заданого
         * @param {PuzzleElement} puzzleElement
         * @param {Number} x
         * @param {Number} y
         * @returns {PuzzleElement} - closest avaible to connect element OR null
         */
        checkElementAtPosition: function (puzzleElement, x, y) {
            var i, j, p, checkElement, localPoint;

            // var t = puzzleElement.getTransformMatrix().getInvertPoint(x,y);
            // localPoint = this.getTransformMatrix().getPoint(t[0], t[1]);
            localPoint = this.getTransformMatrix().getPoint(x, y);


            if (puzzleElement.check(localPoint[0], localPoint[1], this.scale, this.angle)) {
                return this;
            }

            if (this.checkPositionsForEachOtherElemets) {

                // проходимо по всіх не приєднаних елементах
                for (i = 0; i < this.elements.length; i++) {
                    checkElement = this.elements[i];
                    if (checkElement == puzzleElement) continue;
                    if (puzzleElement.connected.indexOf(checkElement) > -1)continue;

                    // пропускаємо не сусідні елементи
                    if (puzzleElement.neighborhood.indexOf(checkElement) === -1) continue;

                    // перетворення абсолютних коорднат в локальні checkElement
                    localPoint = checkElement.getTransformMatrix().getPoint(x, y);
                    if (puzzleElement.check(localPoint[0], localPoint[1], checkElement.scale, checkElement.angle)) {
                        return checkElement;
                    }
                }

                // проходимо по всіх приєднаних елементах з даним елементом
                for (j = 0; j < puzzleElement.connected.length; j++) {
                    p = puzzleElement.connected[j];
                    if (p === puzzleElement) continue;

                    // проходимо по всіх не приєднаних елементах
                    for (i = 0; i < this.elements.length; i++) {
                        checkElement = this.elements[i];
                        if (checkElement === p) continue;
                        if (checkElement === puzzleElement) continue;
                        if (p.connected.indexOf(checkElement) > -1) continue;

                        // пропускаємо не сусідні елементи
                        if (p.neighborhood.indexOf(checkElement) === -1) continue;

                        // перетворення абсолютних коорднат в локальні checkElement
                        localPoint = checkElement.getTransformMatrix().getPoint(x, y);
                        if (puzzleElement.check(localPoint[0], localPoint[1], checkElement.scale, checkElement.angle)) {
                            return checkElement;
                        }
                    }
                }
            }

            return null;
        },

        /**
         * ???
         * @param {PuzzleElement} puzzleElement
         * @param {Number} x
         * @param {Number} y
         */
        trySetElementAtPosition: function (puzzleElement, x, y) {

            /**
             * closest avaible to connect element
             * @type {PuzzleElement}
             */
            var element = this.checkElementAtPosition(puzzleElement, x, y);

            if (element !== null) {
                this.connect(puzzleElement, element);
            }
        },

        /**
         * приєднати елементи
         * @param {PuzzleElement} puzzleElement
         * @param {PuzzleElement} targetPuzzleElement
         */
        connect: function (puzzleElement, targetPuzzleElement) {

            puzzleElement.setToTarget(targetPuzzleElement);

            if (puzzleElement.isConnectedToBoard()) {
                // перемістити всі зєднані елементи з доскою на задній план
                this.setTopBack(puzzleElement);
            }
            else {
                this.bringToFront(puzzleElement);
            }


            if (this.sets.length === 1) {
                console.log('game completed');
                this.onCompleted();
            }
        },

        onCompleted: function () {

        },

        /**
         * змістити елементи в край
         * @param {PuzzleElement[]} elements
         * @param {string} method
         * @private
         */
        _arrange: function (elements, method) {
            // method - 'unshift' or 'push';
            // unshift - на перед списку (вимальовувати будуть останніми)
            for (var j = 0; j < elements.length; j++) {
                var el = elements[j];
                var i = this.elements.indexOf(el);
                if (i > -1) {
                    this.elements.splice(i, 1);
                    this.elements[method](el);
                }
            }
        },

        /**
         * перемістити на задній план
         * @param {PuzzleElement} puzzleElement
         */
        setTopBack: function (puzzleElement) {
            this._arrange(puzzleElement.connected, 'unshift')
        },

        /**
         * перемісти на передній план
         * @param {PuzzleElement} puzzleElement
         */
        bringToFront: function (puzzleElement) {
            this._arrange(puzzleElement.connected, 'push')
        },

        getTransformMatrix: function () {
            return new Transform()
                .translate(-this.position.x, -this.position.y)
                .rotate(this.angle)
                .scale(this.scale, this.scale);
        },

        /**
         * отримати відносного елемента до заданого
         * @param {PuzzleElement[]} elements
         * @param {PuzzleElement} element
         * @param {int} dx
         * @param {int} dy
         * @returns {null|PuzzleElement}
         */
        getElementOffset: function (elements, element, dx, dy) {
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                if ((el.ix === (element.ix + dx)) && ((element.iy + dy) === el.iy)) {
                    return el;
                }
            }
            return null;
        },

        mergeSets: function (set1, set2) {
            this.sets.splice(this.sets.indexOf(set1), 1);
            this.sets.splice(this.sets.indexOf(set2), 1);
            var i, mergedElements = [];
            for (i = 0; i < set1.elements.length; i++) {
                mergedElements.push(set1.elements[i]);
            }
            for (i = 0; i < set2.elements.length; i++) {
                mergedElements.push(set2.elements[i]);
            }
            var elementsSet = {elements: mergedElements, shape: null};
            this.sets.push(elementsSet);

            for (i = 0; i < mergedElements.length; i++) {
                mergedElements[i].elementsSet = elementsSet;
            }
        },

        /**
         * малювати
         * @param {CanvasRenderingContext2D} [ctx]
         */
        draw: function (ctx) {

            ctx.save();

            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(this.angle);
            ctx.scale(this.scale, this.scale);

            var i, k = this.k;

            //this.shape.draw(ctx);

            ctx.restore();
            ctx.save();

            for (i = 0; i < this.sets.length; i++) {
                var elementsSet = this.sets[i];

                if (elementsSet.shape == null) {

                    // створюємо новий SimpleShape для даної колекції зєднаних елементів

                    var mainElement = elementsSet.elements[0];
                    k *= mainElement.scale;
                    var j, minX = 1e00, maxX = -1e100, minY = 1e100, maxY = -1e100;
                    for (j = 0; j < elementsSet.elements.length; j++) {
                        var el = elementsSet.elements[j];
                        maxX = el.ix > maxX ? el.ix : maxX;
                        maxY = el.iy > maxY ? el.iy : maxY;
                        minX = el.ix < minX ? el.ix : minX;
                        minY = el.iy < minY ? el.iy : minY;
                    }
                    var W = (maxX - minX + 2) * k;
                    var H = (maxY - minY + 2) * k;

                    elementsSet.maxX = maxX;
                    elementsSet.maxY = maxY;
                    elementsSet.minX = minX;
                    elementsSet.minY = minY;
                    elementsSet.shape = new SimpleShape(-k / 2, -k / 2, W, H, this.drawSet.bind(this, elementsSet))
                }

                // промалювуємо колекцію зєднаних елементів
                //elementsSet.shape.draw(ctx);
            }

            for (i = 0; i < this.elements.length; i++) {
                this.elements[i].draw(ctx);
            }

            ctx.restore();
        },

        actionWithIntersected: function (element, action) {
            var k = this.k * this.scale;
            var p0 = element.prevPosition;
            for (var i = 0; i < this.elements.length; i++) {
                var el = this.elements[i];
                if (el === element || el === this || element.connected.indexOf(el) > -1) continue;
                var p = el.prevPosition;
                if (GeometryHelper.isIntersectRectangles(p.x, p.y, 2 * k, 2 * k, p0.x, p0.y, 2 * k, 2 * k)) {
                    action(el, i);
                }
            }
        },
        drawIntersected: function (element, ctx) {

            var k = this.k * this.scale;
            var currentZIndex = this.elements.indexOf(element);
            var postDrawItems = [];
            var postDrawItemsDict = {};
            for (var i = 0; i < element.connected.length; i++) {
                var el = element.connected[i];
                if (el == this) continue;


                var x = el.prevPosition.x - k / 2;
                var y = el.prevPosition.y - k / 2;

                ctx.save();

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 2 * k, y);
                ctx.lineTo(x + 2 * k, y + 2 * k);
                ctx.lineTo(x, y + 2 * k);
                ctx.closePath();
                ctx.clip();
                ctx.clearRect(x - 1, y - 1, 2 * k + 2, 2 * k + 2);
                /*
                 ctx.save();
                 ctx.translate(this.position.x, this.position.y);
                 ctx.rotate(this.angle);
                 ctx.scale(this.scale, this.scale);
                 this.shape.draw(ctx);
                 ctx.restore(); */

                this.actionWithIntersected(el, function (ell, zIndex) {
                    if (currentZIndex > zIndex) {
                        ell.draw(ctx);
                        //ell.drawFake(ctx);
                    }
                    else {
                        postDrawItems.push({target: ell, reason: el});
                    }
                });


                ctx.restore();
            }


            for (var i = 0; i < this.elements.length; i++) {
                var el2 = this.elements[i];
                if (el2 === this) continue;

                if (element.connected.indexOf(el2) > -1) {
                    el2.draw(ctx);
                }

                for (var j = 0; j < postDrawItems.length; j++) {
                    if (postDrawItems[j].target === el2) {
                        var x = postDrawItems[j].reason.position.x - k / 2;
                        var y = postDrawItems[j].reason.position.y - k / 2;

                        ctx.save();

                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + 2 * k, y);
                        ctx.lineTo(x + 2 * k, y + 2 * k);
                        ctx.lineTo(x, y + 2 * k);
                        ctx.closePath();
                        ctx.clip();
                        el2.draw(ctx);
                        ctx.restore();
                    }
                }
            }


        },

        findChangedPositionElement: function () {
            for (var i = 0; i < this.elements.length; i++) {
                var el = this.elements[i];
                if (el.prevPosition) {
                    if (el.prevPosition.x !== el.position.x || el.prevPosition.y !== el.position.y) {
                        return el;
                    }
                }
                else {
                    return el;
                }
            }
            return null;
        },

        /**
         * малювати дошку
         * @param {CanvasRenderingContext2D} [ctx]
         */
        _drawerBoard: function (ctx) {

            ctx.translate(10, 10);

            var k = this.k * this.scale;
            var kx = this.kx;
            var ky = this.ky;

            ctx.fillStyle = 'rgba(200,0,0,.5)';
            //ctx.fillRect(0, 0, kx * k, ky * k);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0,0,0,0.3)";

            var i, j, index;
            for (i = 0; i < kx; i++) {
                for (j = 0; j < ky; j++) {
                    index = i * ky + j;
                    var el = this.elements[index];

                    ctx.translate(el.ix * k, el.iy * k);
                    ctx.beginPath();

                    if (el.iy == (ky - 1)) {
                        ctx.moveTo(k, k);
                        PuzzleStuff.drawBottom(ctx, el.bottom, k);
                    }


                    ctx.moveTo(0, k);
                    PuzzleStuff.drawLeft(ctx, el.left, k);

                    PuzzleStuff.drawTop(ctx, el.top, k);

                    if (el.ix == (kx - 1)) {
                        PuzzleStuff.drawRight(ctx, el.right, k);
                    }

                    ctx.shadowColor = "rgba(0,0,0,1)";
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = -2;
                    ctx.shadowOffsetY = -2;

                    ctx.stroke();

                    ctx.shadowColor = "rgba(250,250,250,1)";
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    ctx.stroke();

                    ctx.translate(-el.ix * this.k, -el.iy * this.k);
                }
            }

            ctx.lineWidth = 1;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        },

        drawSet: function (elementsSet, ctx) {
            console.log(elementsSet);
            return;
            var els = elementsSet.elements;

            // шукаємо крайнього лівого
            var startElement = els[0];
            var found = false;
            do {
                found = false;

                for (var i = 0; i < els.length; i++) {
                    if (startElement.iy == els[i].iy && startElement.ix > els[i].ix) {
                        startElement = els[i];
                        found = true;
                        break;
                    }
                }
            }
            while (found);

            var k = this.k * startElement.scale;

            ctx.translate(k / 2, k / 2);

            var el = startElement;

            // clip
            ctx.beginPath();

            do {
                var x0 = (el.ix - elementsSet.minX) * k;
                var y0 = (el.iy - elementsSet.minY) * k;


                ctx.moveTo(x0, y0);
                if (!el._checkConnectedIndexOffset(0, -1)) {
                    PuzzleStuff.drawTop(ctx, this.top, k);
                }
                else {

                }
                PuzzleStuff.drawRight(ctx, this.right, k);
                PuzzleStuff.drawBottom(ctx, this.bottom, k);
                PuzzleStuff.drawLeft(ctx, this.left, k);

            }
            while (el !== startElement);

            ctx.closePath();
            ctx.clip();
        },

        _onElementChanged: function (element, ctx) {


            var objCurrentZIndex = this.elements.indexOf(element);
            var objPrevZIndex = element.prevZindex;

            // notify to all PREV over element that theirs PREV background changed
            this.actionWithIntersected(element, function (el, currentZIndex) {
                var prevZIndex = el.prevZindex;
                if ((objPrevZIndex < prevZIndex) || (objCurrentZIndex < currentZIndex)) {
                    el.shapeBack.isNeedRefresh = true;
                }
            });


            var k = this.k * this.scale;

            for (var i = 0; i < this.elements.length; i++) {
                var el2 = this.elements[i];
                if (el2 === this) continue;

                if (element.connected.indexOf(el2) > -1 || el2.shapeBack.isNeedRefresh) {

                    var x = el2.prevPosition.x - k / 2;
                    var y = el2.prevPosition.y - k / 2;

                    ctx.save();

                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + 2 * k, y);
                    ctx.lineTo(x + 2 * k, y + 2 * k);
                    ctx.lineTo(x, y + 2 * k);
                    ctx.closePath();
                    ctx.clip();
                    //ctx.clearRect(x - 1, y - 1, 2 * k + 2, 2 * k + 2);


                    if (el2.shapeBack.isNeedRefresh) {
                        el2._drawerBackgroundFunc(ctx, el2.shapeBack.ctx);
                        el2.shapeBack.isNeedRefresh = false;
                    }
                    else {
                        ctx.clearRect(x - 1, y - 1, 2 * k + 2, 2 * k + 2);
                        ctx.translate(el2.prevPosition.x, el2.prevPosition.y);
                        el2.shapeBack.draw(ctx);
                        ctx.translate(-el2.prevPosition.x, -el2.prevPosition.y);
                        el2.shapeBack.isNeedRefresh = true;
                    }
                    el2.draw(ctx);

                    //el2._drawerBackgroundFunc(ctx,el2.shapeBack.ctx);

                    ctx.restore();
                }
            }

        }
    };

    /**
     * PuzzleElement
     * @param config
     * @constructor
     * @class PuzzleElement
     */
    var PuzzleElement = function (config) {
        this.bound = config.bound ? config.bound : {x: 0, y: 0, w: 0, h: 0};
        this.origin = {x: 0, y: 0};
        this.origin = {x: (config.bound.w) / 4, y: (config.bound.h) / 4};
        this.position = config.position ? config.position : {x: 0, y: 0};
        this.target = config.target ? config.target : {x: 0, y: 0};
        this.index = config.index;
        this.image = null;

        this.prevZindex = -1;

        /**
         * кут нахилу елемента пазла
         * @type {number}
         */
        this.angle = 0;//Math.PI / 10;//0;//(Math.random() * 2 - 1) * Math.PI / 10;

        /**
         * маштаб елемента пазла
         * @type {number}
         */
        this.scale = 1;//getRandomInt(5, 6) / 5;

        /**
         * прямі сусіди елемента пазла
         * (задеється в конструкторі і є незмінним)
         * @type {PuzzleElement[]}
         * @const
         */
        this.neighborhood = [];

        /**
         * вже приєднані елементи пазла в якому є даний елемент
         * @type {PuzzleElement[]}
         */
        this.connected = [this];

        this.ix = config.ix;
        this.iy = config.iy;

        this.game = config.game;

        this.positionDelta = 20;
        this.scaleDelta = 0.9;
        this.angleDelta = Math.PI / 10;

        var k = this.game.k * this.scale;

        this.shape = new SimpleShape(-k / 2, -k / 2, 2 * k, 2 * k, this._drawer2Func.bind(this));
        this.shapeBack = new SimpleShape(-k / 2, -k / 2, 2 * k, 2 * k, function () {
        });

        this.right = '0';
        this.left = '0';
        this.top = '0';
        this.bottom = '0';

        this.shapeImage = new SimpleShape(-k / 2, -k / 2, 2 * k, 2 * k, this._drawerImageFunc.bind(this));
        this.shapeMask = new SimpleShape(-k / 2, -k / 2, 2 * k, 2 * k, this._drawerMaskFunc.bind(this));

        //this.shape.autoRefresh = true;
        this.edgeConnecting = [true, true, true, true];
    };
    PuzzleElement.prototype = {
        constructor: PuzzleElement,


        /**
         * is connected to board
         * @returns {boolean}
         */
        isConnectedToBoard: function () {
            return this.connected.indexOf(this.game) > -1;
        },

        check: function (offsetX, offsetY, globalScale, globalAngle) {
            // TODO dfgdf
            if ((Math.abs(offsetX - this.target.x) <= this.positionDelta) &&
                (Math.abs(offsetY - this.target.y) <= this.positionDelta) &&
                (Math.abs(this.scale - globalScale) <= this.scaleDelta) &&
                (Math.abs(this.angle - globalAngle) <= this.angleDelta)) {
                return true;
            }
            return false;
        },

        /**
         * check Over
         * @param {Number} offsetX - global x position
         * @param {Number} offsetY - global y position
         * @returns {*}
         */
        checkOver: function (offsetX, offsetY) {

            // матриця перетворення з глобальних координат в локальні елемента
            var p = new Transform()
                .translate(-this.position.x, -this.position.y)
                //.translate(-this.origin.x, -this.origin.y)
                .rotate(this.angle)
                .scale(1 / this.scale, 1 / this.scale)
                //.translate(this.origin.x, this.origin.y)
                .getPoint(offsetX, offsetY);

            var x = p[0];
            var y = p[1];

            var b = this.bound; // local coordinates
            var s = 1; //this.scale;

            // переврка чи попадає в грубі межі @this.bound
            if ((b.w + b.x) * s >= x && b.x * s <= x && (b.h + b.y) * s >= y && b.y * s <= y) {

                // радіус в пікселях де шукаємо перекриття з маскою
                var d = this.game.pixelCollisionRadius;

                // малюємо маску
                this.shapeMask.draw();

                // перехід в локальні координати @this.shapeMask
                var x2 = (x - b.x) * this.scale;
                var y2 = (y - b.y) * this.scale;

                var mask = this.shapeMask.ctx.getImageData(x2 - d, y2 - d, 2 * d + 1, 2 * d + 1);

                var over = false;
                for (var i = 0; i < 16 * d; i += 4) {
                    if (mask.data[i] == 0 &&
                        mask.data[i + 1] == 0 &&
                        mask.data[i + 2] == 0 &&
                        mask.data[i + 3] == 255) {
                        over = true;
                        break;
                    }
                }

                if (over) {
                    return {localPoint: {x: x, y: y}};
                }
                return false;
            }
            return false;
        },

        /**
         * check Over bound
         * @param {Number} offsetX - global x position
         * @param {Number} offsetY - global y position
         * @returns {boolean}
         */
        checkOverBound: function (offsetX, offsetY) {

            // матриця перетворення з глобальних координат в локальні елемента
            var p = new Transform()
                .translate(-this.position.x, -this.position.y)
                //.translate(-this.origin.x, -this.origin.y)
                .rotate(this.angle)
                .scale(1 / this.scale, 1 / this.scale)
                //.translate(this.origin.x, this.origin.y)
                .getPoint(offsetX, offsetY);

            var x = p[0];
            var y = p[1];

            var b = this.bound; // local coordinates
            var s = 1; //this.scale;

            return (b.w + b.x) * s >= x && b.x * s <= x && (b.h + b.y) * s >= y && b.y * s <= y;
        },

        getTransformMatrix: function () {
            return new Transform()
                .translate(-this.position.x, -this.position.y)
                //.translate(-this.origin.x, -this.origin.y)
                .rotate(this.angle)
                .scale(1 / this.scale, 1 / this.scale)
                //.translate(this.origin.x, this.origin.y)
                .translate(this.target.x, this.target.y);
        },

        /**
         * перемістити елемент пазла та всіх зєднаних
         * @param {Number} x
         * @param {Number} y
         * @param {Object} dragInfo
         */
        drag: function (x, y, dragInfo) {

            this.position.x = (x - dragInfo.startScreen.x) + dragInfo.startPosition.x;
            this.position.y = (y - dragInfo.startScreen.y) + dragInfo.startPosition.y;

            var m = this.getTransformMatrix();

            for (var i = 0; i < this.connected.length; i++) {
                var c = this.connected[i];

                var localPoint = m.getInvertPoint(c.target.x, c.target.y);

                c.position.x = localPoint[0];
                c.position.y = localPoint[1];
            }
        },

        /**
         * зєднати поточний елемент пазла з цільовим
         * @param {PuzzleElement} targetElement
         */
        setToTarget: function (targetElement) {
            var set1 = this.elementsSet;
            var set2 = targetElement.elementsSet;

            var isSameScale = (this.scale === targetElement.scale);
            var isSameAngle = (this.angle === targetElement.angle);

            var normalMatrix = targetElement.getTransformMatrix();

            var connectedElements = targetElement.connected;

            var localPoint = normalMatrix.getInvertPoint(this.target.x, this.target.y);
            this.position.x = localPoint[0];
            this.position.y = localPoint[1];
            this.angle = targetElement.angle;
            this.scale = targetElement.scale;

            var i, cEl;
            var k = this.game.k * this.scale;

            for (i = 0; i < this.connected.length; i++) {
                cEl = this.connected[i];
                if (cEl != this) {
                    localPoint = normalMatrix.getInvertPoint(cEl.target.x, cEl.target.y);
                    cEl.position.x = localPoint[0];
                    cEl.position.y = localPoint[1];
                    cEl.angle = targetElement.angle;
                    cEl.scale = targetElement.scale;
                }

                if (connectedElements.indexOf(cEl) === -1) {
                    connectedElements.push(cEl);
                    if (cEl != this)
                        cEl.connected = connectedElements;
                }
            }

            this.connected = connectedElements;

            for (i = 0; i < this.connected.length; i++) {
                cEl = this.connected[i];

                if (!isSameScale) {
                    if (cEl !== this.game) {
                        cEl.shape = new SimpleShape(-k / 2, -k / 2, 2 * k, 2 * k, cEl._drawerFunc.bind(cEl));
                        cEl.shapeMask = new SimpleShape(-k / 2, -k / 2, 2 * k, 2 * k, cEl._drawerMaskFunc.bind(cEl));
                    }
                }

                //cEl.shape.isNeedRefresh = true;
            }

            this.game.mergeSets(set1, set2);
        },

        /**
         * перевірка чи підєднаний відностий елемент до поточного
         * @param {int} dx
         * @param {int} dy
         * @returns {boolean}
         * @private
         */
        _checkConnectedIndexOffset: function (dx, dy) {
            return PuzzleI.prototype.getElementOffset(this.connected, this, dx, dy) !== null;
        },

        drawFake: function (ctx) {

            var k = this.game.k * this.scale;

            ctx.save();

            ctx.translate(this.position.x, this.position.y);
            //ctx.translate(this.origin.x, this.origin.y);
            ctx.rotate(this.angle);
            //ctx.scale(this.scale, this.scale);
            //ctx.translate(-this.origin.x, -this.origin.y);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(-k / 2, -k / 2, 2 * k, 2 * k);
            ctx.strokeRect(0, 0, k, k);

            ctx.restore();
        },

        /**
         * draw
         * @param {CanvasRenderingContext2D} [ctx]
         */
        draw: function (ctx) {

            var edgeConnecting = [
                // top edge
                this._checkConnectedIndexOffset(0, -1),
                // right edge
                this._checkConnectedIndexOffset(1, 0),
                // bottom edge
                this._checkConnectedIndexOffset(0, 1),
                // left edge
                this._checkConnectedIndexOffset(-1, 0)
            ];
            var edgesStateChanged
                = (edgeConnecting[0] !== this.edgeConnecting[0])
                || (edgeConnecting[1] !== this.edgeConnecting[1])
                || (edgeConnecting[2] !== this.edgeConnecting[2])
                || (edgeConnecting[3] !== this.edgeConnecting[3]);

            this.prevPosition = {x: this.position.x, y: this.position.y};
            this.prevZindex = this.game.elements.indexOf(this);

            ctx.save();

            ctx.translate(this.position.x, this.position.y);
            //ctx.translate(this.origin.x, this.origin.y);
            ctx.rotate(this.angle);
            //ctx.scale(this.scale, this.scale);
            //ctx.translate(-this.origin.x, -this.origin.y);


            if (this.shapeBack.isNeedRefresh) {
                this._drawerBackgroundFunc(ctx, this.shapeBack.ctx);
                this.shapeBack.isNeedRefresh = false;
            }

            if (edgesStateChanged) {
                this.shape.isNeedRefresh = true;
            }
            this.shape.draw(ctx);

            this.edgeConnecting = edgeConnecting;

            ctx.restore();


            /*ctx.save();

             var p = this.target;
             var t1 = this.getTransformMatrix().getInvertPoint(p.x, p.y);
             var t2 = this.getTransformMatrix().getInvertPoint(p.x + 100, p.y);
             var t3 = this.getTransformMatrix().getInvertPoint(p.x, p.y + 100);

             ctx.beginPath();
             ctx.moveTo(t1[0],t1[1]);
             ctx.lineTo(t2[0],t2[1]);
             ctx.lineTo(t3[0],t3[1]);
             ctx.closePath();
             ctx.strokeStyle = '#ff0';
             ctx.stroke();

             ctx.restore();*/

            /*ctx.save();
             ctx.translate(this.position.x, this.position.y);
             //ctx.translate(this.origin.x, this.origin.y);
             ctx.rotate(this.angle);
             //ctx.scale(this.scale, this.scale);
             //ctx.translate(-this.origin.x, -this.origin.y);
             this.shapeMask.draw(ctx);
             ctx.restore();*/
        },


        connectedStyle: {
            draw: true,
            drawAfter: true,
            lileWidth: 1.001,//0.8,
            shadowColor1: 'rgba(50,50,50,.1)',
            shadowColor2: 'rgba(200,200,200,.1)',
            strokeStyle: 'rgba(0,0,0,.1)'
        },
        notConnectedStyle: {
            draw: true,
            drawAfter: true,
            lileWidth: 2,//0.8,
            shadowColor1: '#000',
            shadowColor2: '#fff',
            strokeStyle: 'rgba(0,0,0,1)'
        },

        /**
         * drawer
         * @param {CanvasRenderingContext2D} ctx
         * @param {boolean} [isConnected]
         * @param {int} [edgeId]
         * @param {string} [edgeTypeId]
         * @param {number} k
         * @private
         */
        __drawerBefore: function (ctx, isConnected, edgeId, edgeTypeId, k) {

            // edgeId
            // 0 - top
            // 1 - right
            // 2 - bottom
            // 3 - left
            // undefined - all

            // isConnected
            // true
            // false
            // undefined - auto define

            // edgeTypeId
            // '0'
            // ('1'|'2') + (''|'i'|'m'|'mi')
            // undefined

            var notConnectedStyle = {
                drawBefore: true
            };
            var connectedStyle = {
                drawBefore: true
            };

            //var k = this.game.k * this.scale;
            var style, isConnectedEdge;

            //ctx.translate(k / 2, k / 2);

            if (edgeId === 0 || edgeId === undefined) {
                isConnectedEdge = isConnected;
                if (isConnectedEdge === undefined) {
                    isConnectedEdge = this._checkConnectedIndexOffset(0, -1);
                }
                style = isConnectedEdge ? connectedStyle : notConnectedStyle;
                if (style.drawBefore) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    PuzzleStuff.drawTop(ctx, edgeTypeId === undefined ? this.top : edgeTypeId, k);
                    isConnectedEdge ? this._drawShadowConnected(ctx) : this._drawShadowNotConnected(ctx);
                }
            }
            if (edgeId === 1 || edgeId === undefined) {
                isConnectedEdge = isConnected;
                if (isConnectedEdge === undefined) {
                    isConnectedEdge = this._checkConnectedIndexOffset(1, 0);
                }
                style = isConnectedEdge ? connectedStyle : notConnectedStyle;
                if (style.drawBefore) {
                    ctx.beginPath();
                    ctx.moveTo(k, 0);
                    PuzzleStuff.drawRight(ctx, edgeTypeId === undefined ? this.right : edgeTypeId, k);
                    isConnectedEdge ? this._drawShadowConnected(ctx) : this._drawShadowNotConnected(ctx);
                }
            }
            if (edgeId === 2 || edgeId === undefined) {
                isConnectedEdge = isConnected;
                if (isConnectedEdge === undefined) {
                    isConnectedEdge = this._checkConnectedIndexOffset(0, 1);
                }
                style = isConnectedEdge ? connectedStyle : notConnectedStyle;
                if (style.drawBefore) {
                    ctx.beginPath();
                    ctx.moveTo(k, k);
                    PuzzleStuff.drawBottom(ctx, edgeTypeId === undefined ? this.bottom : edgeTypeId, k);
                    isConnectedEdge ? this._drawShadowConnected(ctx) : this._drawShadowNotConnected(ctx);
                }
            }
            if (edgeId === 3 || edgeId === undefined) {
                isConnectedEdge = isConnected;
                if (isConnectedEdge === undefined) {
                    isConnectedEdge = this._checkConnectedIndexOffset(-1, 0);
                }
                style = isConnectedEdge ? connectedStyle : notConnectedStyle;
                if (style.drawBefore) {
                    ctx.beginPath();
                    ctx.moveTo(0, k);
                    PuzzleStuff.drawLeft(ctx, edgeTypeId === undefined ? this.left : edgeTypeId, k);
                    isConnectedEdge ? this._drawShadowConnected(ctx) : this._drawShadowNotConnected(ctx);
                }
            }

            // clip
            /*ctx.beginPath();
             ctx.moveTo(0, 0);
             PuzzleStuff.drawTop(ctx, this.top, k);
             PuzzleStuff.drawRight(ctx, this.right, k);
             PuzzleStuff.drawBottom(ctx, this.bottom, k);
             PuzzleStuff.drawLeft(ctx, this.left, k);
             ctx.closePath();
             ctx.clip();*/
        },
        /**
         * drawer
         * @param {CanvasRenderingContext2D} ctx
         * @param {boolean} [isConnected]
         * @param {int} [edgeId]
         * @param {string} [edgeTypeId]
         * @param {number} k
         * @private
         */
        __drawerAfter: function (ctx, isConnected, edgeId, edgeTypeId, k) {
            // edgeId
            // 0 - top
            // 1 - right
            // 2 - bottom
            // 3 - left
            // undefined - all

            // isConnected
            // true
            // false
            // undefined - auto define

            // edgeTypeId
            // '0'
            // ('1'|'2') + (''|'i'|'m'|'mi')
            // undefined

            var notConnectedStyle = this.notConnectedStyle;
            var connectedStyle = this.connectedStyle;

            //var k = this.game.k * this.scale;
            var style, isConnectedEdge;

            //ctx.translate(k / 2, k / 2);

            // clip
            /*ctx.beginPath();
             ctx.moveTo(0, 0);
             PuzzleStuff.drawTop(ctx, this.top, k);
             PuzzleStuff.drawRight(ctx, this.right, k);
             PuzzleStuff.drawBottom(ctx, this.bottom, k);
             PuzzleStuff.drawLeft(ctx, this.left, k);
             ctx.closePath();
             ctx.clip();*/

            if (edgeId === 0 || edgeId === undefined) {
                isConnectedEdge = isConnected;
                if (isConnectedEdge === undefined) {
                    isConnectedEdge = this._checkConnectedIndexOffset(0, -1);
                }
                style = isConnectedEdge ? connectedStyle : notConnectedStyle;
                if (style.drawAfter) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    PuzzleStuff.drawTop(ctx, edgeTypeId === undefined ? this.top : edgeTypeId, k);
                    //
                    ctx.strokeStyle = style.strokeStyle;
                    ctx.lineWidth = style.lileWidth;

                    ctx.shadowColor = style.shadowColor1;
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    ctx.stroke();

                    ctx.shadowColor = style.shadowColor2;
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = -2;
                    ctx.shadowOffsetY = -2;
                    ctx.stroke();
                }
            }
            if (edgeId === 1 || edgeId === undefined) {
                isConnectedEdge = isConnected;
                if (isConnectedEdge === undefined) {
                    isConnectedEdge = this._checkConnectedIndexOffset(1, 0);
                }
                style = isConnectedEdge ? connectedStyle : notConnectedStyle;
                if (style.drawAfter) {
                    ctx.beginPath();
                    ctx.moveTo(k, 0);
                    PuzzleStuff.drawRight(ctx, edgeTypeId === undefined ? this.right : edgeTypeId, k);
                    //
                    ctx.strokeStyle = style.strokeStyle;
                    ctx.lineWidth = style.lileWidth;

                    ctx.shadowColor = style.shadowColor1;
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    ctx.stroke();

                    ctx.shadowColor = style.shadowColor2;
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = -2;
                    ctx.shadowOffsetY = -2;
                    ctx.stroke();
                }
            }
            if (edgeId === 2 || edgeId === undefined) {
                isConnectedEdge = isConnected;
                if (isConnectedEdge === undefined) {
                    isConnectedEdge = this._checkConnectedIndexOffset(0, 1);
                }
                style = isConnectedEdge ? connectedStyle : notConnectedStyle;
                if (style.drawAfter) {
                    ctx.beginPath();
                    ctx.moveTo(k, k);
                    PuzzleStuff.drawBottom(ctx, edgeTypeId === undefined ? this.bottom : edgeTypeId, k);
                    //
                    ctx.strokeStyle = style.strokeStyle;
                    ctx.lineWidth = style.lileWidth;

                    ctx.shadowColor = style.shadowColor1;
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    ctx.stroke();

                    ctx.shadowColor = style.shadowColor2;
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = -2;
                    ctx.shadowOffsetY = -2;
                    ctx.stroke();
                }
            }
            if (edgeId === 3 || edgeId === undefined) {
                isConnectedEdge = isConnected;
                if (isConnectedEdge === undefined) {
                    isConnectedEdge = this._checkConnectedIndexOffset(-1, 0);
                }
                style = isConnectedEdge ? connectedStyle : notConnectedStyle;
                if (style.drawAfter) {
                    ctx.beginPath();
                    ctx.moveTo(0, k);
                    PuzzleStuff.drawLeft(ctx, edgeTypeId === undefined ? this.left : edgeTypeId, k);
                    //
                    ctx.strokeStyle = style.strokeStyle;
                    ctx.lineWidth = style.lileWidth;

                    ctx.shadowColor = style.shadowColor1;
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    ctx.stroke();

                    ctx.shadowColor = style.shadowColor2;
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = -2;
                    ctx.shadowOffsetY = -2;
                    ctx.stroke();
                }
            }
        },
        /**
         * drawer
         * @param {CanvasRenderingContext2D} ctx
         * @private
         */
        __drawerImage: function (ctx) {

            var k = this.game.k * this.scale;
            var kx = this.game.kx;
            var ky = this.game.ky;
            var image = this.game.image;
            var ix = this.ix;
            var iy = this.iy;

            var imgW = image.width ? image.width : image.data.width;
            var imgH = image.height ? image.height : image.data.height;

            var sx = k * ix - k / 2;
            var dx = -k / 2;
            var dw = 2 * k;
            if (ix == 0) {
                sx = 0;
                dx = 0;
                dw = k * 1.5;
            }
            if (ix == kx - 1) {
                dw = k * 1.5;
            }
            var sy = k * iy - k / 2;
            var dy = -k / 2;
            var dh = 2 * k;
            if (iy == 0) {
                sy = 0;
                dy = 0;
                dh = k * 1.5;
            }
            if (iy == ky - 1) {
                dh = k * 1.5;
            }
            var imgScaleX = imgW / (kx * k);
            var imgScaleY = imgH / (ky * k);
            ctx.drawImage(image.data, sx * imgScaleX, sy * imgScaleY, dw * imgScaleX, dh * imgScaleY, dx, dy, dw, dh);
        },

        _drawShadowNotConnected: function (ctx) {
            ctx.lineWidth = 1.0001;///.5;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 5;
            ctx.strokeStyle = 'rgba(0,0,0,.5)';

            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.stroke();

            ctx.shadowOffsetX = -2;
            ctx.shadowOffsetY = 2;
            ctx.stroke();

            ctx.shadowOffsetX = -2;
            ctx.shadowOffsetY = -2;
            ctx.stroke();

            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = -2;
            ctx.stroke();
        },
        _drawShadowConnected: function (ctx) {
            ctx.lineWidth = 1.001;//0.8;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 2;
            ctx.strokeStyle = 'rgba(0,0,0,.5)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.stroke();
        },

        _drawerFunc: function (ctx) {

            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            var k = this.game.k * this.scale;
            ctx.translate(k / 2, k / 2);

            // draw outer shadow of puzzle element
            this.__drawerBefore(ctx, undefined, undefined, undefined, k);

            // clip
            ctx.beginPath();
            ctx.moveTo(0, 0);
            PuzzleStuff.drawTop(ctx, this.top, k);
            PuzzleStuff.drawRight(ctx, this.right, k);
            PuzzleStuff.drawBottom(ctx, this.bottom, k);
            PuzzleStuff.drawLeft(ctx, this.left, k);
            ctx.closePath();
            ctx.clip();

            // draw image start
            this.__drawerImage(ctx);

            // draw inner shadow of puzzle element
            this.__drawerAfter(ctx, undefined, undefined, undefined, k);

            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        },
        _drawerMaskFunc: function (ctx) {

            var k = this.game.k * this.scale;

            ctx.strokeStyle = 'rgba(255,0,0,1)';

            ctx.translate(k / 2, k / 2);

            // clip
            ctx.beginPath();
            ctx.moveTo(0, 0);
            PuzzleStuff.drawTop(ctx, this.top, k);
            PuzzleStuff.drawRight(ctx, this.right, k);
            PuzzleStuff.drawBottom(ctx, this.bottom, k);
            PuzzleStuff.drawLeft(ctx, this.left, k);
            ctx.closePath();
            ctx.clip();

            ctx.fillRect(-k / 2, -k / 2, 2 * k, 2 * k);
        },
        _drawerImageFunc: function (ctx) {

            var k = this.game.k * this.scale;

            ctx.translate(k / 2, k / 2);

            // clip
            ctx.beginPath();
            ctx.moveTo(0, 0);
            PuzzleStuff.drawTop(ctx, this.top, k);
            PuzzleStuff.drawRight(ctx, this.right, k);
            PuzzleStuff.drawBottom(ctx, this.bottom, k);
            PuzzleStuff.drawLeft(ctx, this.left, k);
            ctx.closePath();
            ctx.clip();

            // draw image start
            this.__drawerImage(ctx);

            ctx.fillStyle = 'rgba(250, 0, 0, 0.05)';
            ctx.fillRect(-k / 2, -k / 2, 2 * k, 2 * k);
        },
        _drawerEdgeFunc: function (ctx, isConnected, edgeId, edgeTypeId, k) {
            console.log(isConnected, edgeId, edgeTypeId, k);
            // edgeId
            // 0 - top
            // 1 - right
            // 2 - bottom
            // 3 - left
            // undefined - all

            // isConnected
            // true
            // false
            // undefined - auto define

            // edgeTypeId
            // '0'
            // ('1'|'2') + (''|'i'|'m'|'mi')
            // undefined

            //var k = this.game.k * this.scale;
            ctx.translate(k / 2, k / 2);

            // draw outer shadow of puzzle element
            this.__drawerBefore(ctx, isConnected, edgeId, edgeTypeId, k);

            // clip
            ctx.beginPath();

            ctx.moveTo(0, 0);
            PuzzleStuff.drawTop(ctx, (edgeId === 0 || edgeId === undefined) ? (edgeTypeId === undefined ? this.top : edgeTypeId) : '0', k);

            //ctx.moveTo(k, 0);
            PuzzleStuff.drawRight(ctx, (edgeId === 1 || edgeId === undefined) ? (edgeTypeId === undefined ? this.right : edgeTypeId) : '0', k);

            //ctx.moveTo(k, k);
            PuzzleStuff.drawBottom(ctx, (edgeId === 2 || edgeId === undefined) ? (edgeTypeId === undefined ? this.bottom : edgeTypeId) : '0', k);

            //ctx.moveTo(0, k);
            PuzzleStuff.drawLeft(ctx, (edgeId === 3 || edgeId === undefined) ? (edgeTypeId === undefined ? this.left : edgeTypeId) : '0', k);

            ctx.closePath();
            ctx.clip();

            ctx.clearRect(-k / 2, -k / 2, 2 * k, 2 * k);

            // draw inner shadow of puzzle element
            this.__drawerAfter(ctx, isConnected, edgeId, edgeTypeId, k);
        },
        _drawer2Func: function (ctx) {

            var k = this.game.k * this.scale;
            ctx.translate(k / 2, k / 2);

            // draw image
            this.shapeImage.draw(ctx);

            // draw edges
            PuzzleStuff.drawEdge({
                isConnected: this._checkConnectedIndexOffset(0, -1),
                edgeId: 0,
                edgeTypeId: this.top,
                k: k
            }, ctx);
            PuzzleStuff.drawEdge({
                isConnected: this._checkConnectedIndexOffset(1, 0),
                edgeId: 1,
                edgeTypeId: this.right,
                k: k
            }, ctx);
            PuzzleStuff.drawEdge({
                isConnected: this._checkConnectedIndexOffset(0, 1),
                edgeId: 2,
                edgeTypeId: this.bottom,
                k: k
            }, ctx);
            PuzzleStuff.drawEdge({
                isConnected: this._checkConnectedIndexOffset(-1, 0),
                edgeId: 3,
                edgeTypeId: this.left,
                k: k
            }, ctx);
        },

        _drawerBackgroundFunc: function (ctxSource, ctxTarget) {
            var k = this.game.k * this.scale;

            var p = this.position;
            // TODO correct bound on scale !=1 and rotate != 0

            ctxTarget.setTransform(1, 0, 0, 1, 0, 0);
            ctxTarget.drawImage(ctxSource.canvas, p.x + k / 2, p.y + k / 2, 2 * k, 2 * k, 0, 0, 2 * k, 2 * k);

            ctxTarget.fillStyle = '#000';
            // ctxTarget.strokeRect(10,10,2*k-20,2*k-20);
        },
    };

    var PuzzleStuff = {
        /**
         * @param {Array} path
         * @param {CanvasRenderingContext2D} ctx
         * @param {Number} x
         * @param {Number} y
         * @param {Number} a
         * @param {Number} b
         * @param {Boolean} [back]
         */
        draw1: function (path, ctx, x, y, a, b, back) {

            var dx = Math.abs(path[0][0] - path[path.length - 1][0]);

            var p = [];
            for (i = 0; i < path.length; i++) {
                p[i] = path[i];
            }
            if (back !== undefined || b == true) {
                p.reverse();
            }

            a = (-p[0][0] * x / dx + a);
            b = (-p[0][1] * y / dx + b);
            x /= dx;
            y /= dx;

            var i = 0;
            while (i < p.length) {
                if (i === 0) {
                    //ctx.moveTo(t[0] * x + a, t[1] * y + b);
                    i++;
                }
                ctx.bezierCurveTo(p[i][0] * x + a, p[i][1] * y + b, p[i + 1][0] * x + a, p[i + 1][1] * y + b, p[i + 2][0] * x + a, p[i + 2][1] * y + b);
                i += 3;
            }
        },
        path1: [
            [-10, 300],
            [ 52, 301],
            [169, 343],
            [199, 321],
            [227, 301],
            [171, 199],
            [168, 172],
            [157, 62],
            [278, 90],
            [336, 161],
            [372, 205],
            [300, 269],
            [308, 294],
            [323, 342],
            [510, 313],
            [564, 300]
        ],
        path2: [
            [  3, 330],
            [ 22, 327],
            [151, 373],
            [188, 342],
            [201, 331],
            [221, 247],
            [175, 222],
            [ 81, 171],
            [301, 130],
            [344, 176],
            [461, 301],
            [288, 274],
            [311, 332],
            [346, 421],
            [535, 332],
            [594, 330]
        ],
        drawTop: function (ctx, type, size) {
            if (type === undefined || type === '0') {
                ctx.lineTo(size, 0);
            }
            else {
                var pathIndex = type[0];
                type = type.substr(1);
                if (type === '') {
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, size, size, 0, 0);
                }
                else if (type === 'i') {
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, -size, size, 0, 0, true);
                }
                else if (type === 'm') {
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, size, -size, 0, 0);
                }
                else if (type === 'mi') {
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, -size, -size, 0, 0, true);
                }
                else {
                    ctx.lineTo(size, 0);
                }
            }
        },
        drawRight: function (ctx, type, size) {
            if (type === undefined || type === '0') {
                ctx.lineTo(size, size);
            }
            else {
                var pathIndex = type[0];
                type = type.substr(1);
                if (type === '') {
                    ctx.rotate(Math.PI / 2);
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, size, size, 0, -size);
                    ctx.rotate(-Math.PI / 2);
                }
                else if (type === 'i') {
                    ctx.rotate(Math.PI / 2);
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, -size, size, 0, -size, true);
                    ctx.rotate(-Math.PI / 2);
                }
                else if (type === 'mi') {
                    ctx.rotate(Math.PI / 2);
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, -size, -size, 0, -size, true);
                    ctx.rotate(-Math.PI / 2);
                }
                else if (type === 'm') {
                    ctx.rotate(Math.PI / 2);
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, size, -size, 0, -size);
                    ctx.rotate(-Math.PI / 2);
                }
                else {
                    ctx.lineTo(size, size);
                }
            }
        },
        drawBottom: function (ctx, type, size) {
            if (type === undefined || type === '0') {
                ctx.lineTo(0, size);
            }
            else {
                var pathIndex = type[0];
                type = type.substr(1);
                if (type === '') {
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, size, size, size, size, true);
                }
                else if (type === 'i') {
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, -size, size, size, size);
                }
                else if (type === 'm') {
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, size, -size, size, size, true);
                }
                else if (type === 'mi') {
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, -size, -size, size, size);
                }
                else {
                    ctx.lineTo(0, size);
                }
            }
        },
        drawLeft: function (ctx, type, size) {
            if (type === undefined || type === '0') {
                ctx.lineTo(0, 0);
            }
            else {
                var pathIndex = type[0];
                type = type.substr(1);
                if (type === '') {
                    ctx.rotate(-Math.PI / 2);
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, -size, -size, -size, 0, true);
                    ctx.rotate(Math.PI / 2);
                }
                else if (type === 'i') {
                    ctx.rotate(-Math.PI / 2);
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, size, -size, -size, 0);
                    ctx.rotate(Math.PI / 2);
                }
                else if (type === 'mi') {
                    ctx.rotate(-Math.PI / 2);
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, size, size, -size, 0);
                    ctx.rotate(Math.PI / 2);
                }
                else if (type === 'm') {
                    ctx.rotate(-Math.PI / 2);
                    PuzzleStuff.draw1(PuzzleStuff['path' + pathIndex], ctx, -size, size, -size, 0, true);
                    ctx.rotate(Math.PI / 2);
                }
                else {
                    ctx.lineTo(0, 0);
                }
            }
        },
        shapeCache: [], // {key,shape}
        getIndexCache: function (key) {
            var s = PuzzleStuff.shapeCache;
            for (var i = 0; i < s.length; i++) {
                if (PuzzleStuff.keyCompare(s[i].key, key)) {
                    return i;
                }
            }
            return -1;
        },
        keyCompare: function (key1, key2) {
            var k;
            for (k in key1) {
                if (key1[k] !== key2[k]) return false;
            }
            for (k in key2) {
                if (key2[k] !== key1[k]) return false;
            }
            return true;
        },
        generateAllPossibleEdge: function (k) {
            // edgeId
            // 0 - top
            // 1 - right
            // 2 - bottom
            // 3 - left
            // undefined - all

            // isConnected
            // true
            // false
            // undefined - auto define

            // edgeTypeId
            // '0'
            // ('1'|'2') + (''|'i'|'m'|'mi')
            // undefined

            var isConnected_v = [true, false];
            var edgeId_v = [0, 1, 2, 3];
            var edgeTypeId_v = ['0', '1', '1i', '1m', '1mi', '2', '2i', '2m', '2mi'];

            for (var i = 0; i < isConnected_v.length; i++) {
                var isConnected = isConnected_v[i];
                for (var j = 0; j < edgeId_v.length; j++) {
                    var edgeId = edgeId_v[j];
                    for (var q = 0; q < edgeTypeId_v.length; q++) {
                        var edgeTypeId = edgeTypeId_v[q];
                        var key = {
                            isConnected: isConnected,
                            edgeId: edgeId,
                            edgeTypeId: edgeTypeId,
                            k: k
                        };
                        if (PuzzleStuff.getIndexCache(key) > -1)return;
                        var shape = new SimpleShape(-k / 2, -k / 2, 2 * k, 2 * k, function () {
                            console.log(1);
                        });
                        shape.isNeedRefresh = false;
                        PuzzleElement.prototype._drawerEdgeFunc(shape.ctx, isConnected, edgeId, edgeTypeId, k);
                        shape.__key = key;
                        PuzzleStuff.shapeCache.push({key: key, value: shape});
                    }
                }
            }

        },
        drawEdge: function (key, ctx) {
            var i = PuzzleStuff.getIndexCache(key);
            PuzzleStuff.shapeCache[i].value.draw(ctx);
        }
    };


    module.PuzzleStuff = PuzzleStuff;
    module.PuzzleElement = PuzzleElement;
    module.PuzzleI = PuzzleI;
    module.Waiter = Waiter;
    module.dragOneTouches = dragOneTouches;
    module.dragTwoTouches = dragTwoTouches;
    module.getRandomInt = getRandomInt;
    module.sign = sign;
    module.GeometryHelper = GeometryHelper;
    module.SimpleShape = SimpleShape;
});
defineModule('puzzle-app', [
    'Transformations', 'InputExtension', 'MultiLayeredCanvas',
    'CanvasDebugShape',
    'puzzle-core'
], function (module, $r) {

    /**
     *  @overview PuzzleApp
     **/

    'use strict';

    var ViewTransformation = $r('Transformations').ViewTransformation;
    var PuzzleI = $r('puzzle-core').PuzzleI;
    var In = $r('InputExtension').In;
    var MultiLayeredCanvas = $r('MultiLayeredCanvas').MultiLayeredCanvas;
    var CanvasDebugShape = $r('CanvasDebugShape').CanvasDebugShape;

    var PuzzleApp = function () {

        var that = this;

        this.transform = new ViewTransformation();
        this.transform.translate(150, 150);
        this.transform.updateTransform();

        this.prevMatrix = [0, 0, 0, 0, 0, 0];

        function checkAndSaveMatrix() {
            var m = that.transform.matrix.m;
            var p = that.prevMatrix;

            for (var i = 0; i < 6; i++) {
                if (m[i] !== p[i]) {
                    do {
                        p[i] = m[i];
                        i++;
                    }
                    while (i < 6);
                    return true;
                }
            }
            return false;
        }


        this.game = new PuzzleI();
        this.timerStartGame = Date.now();
        this.drawed = false;

        this.initGame = function (config) {
            this.game = new PuzzleI();
            this.timerStartGame = Date.now();
            this.game.init(config);
            this.game.onCompleted = that._onGameCompleted.bind(that);
            this.drawed = false;
        };


        this._onGameCompleted = function () {
            this.onGameCompleted();
        };

        this.onGameCompleted = function () {

        };

        this.tpd = {
            active: false,
            startTouchs: {},
            startTransform: {angle: 0, scale: 0, x: 0, y: 0},
            lastTouchs: {}
        };
        var ns = this.navigationState = {
            reset: function () {
                ns._waiterSecondTouch = null;
            },
            waitSecondTouch: function (milisecconds, timeout_callbackFunction, callbackFunction, x, y) {
                ns._waiterSecondTouch = new Waiter(milisecconds, timeout_callbackFunction, callbackFunction);
                ns._waiterSecondTouch.x = x;
                ns._waiterSecondTouch.y = y;
                return ns._waiterSecondTouch;
            },
            cancelWaitSecondTouch: function () {
                if (ns._waiterSecondTouch) {
                    return ns._waiterSecondTouch.cancel();
                }
                else return true;
            },
            forceWaitSecondTouch: function () {
                if (ns._waiterSecondTouch)
                    return ns._waiterSecondTouch.force();
                return false;
            },
            isFired: function () {
                if (ns._waiterSecondTouch)
                    return ns._waiterSecondTouch.fired;
                return false
            },
            isCanceled: function () {
                if (ns._waiterSecondTouch)
                    return ns._waiterSecondTouch.canceled;
                return false;
            },
            isRadiusEscape: function (posx, posy) {
                //return false;
                if (ns._waiterSecondTouch) {
                    if (!ns._waiterSecondTouch.fired) {
                        var dx = posx - ns._waiterSecondTouch.x;
                        var dy = posy - ns._waiterSecondTouch.y;
                        if (dx * dx + dy * dy > 20 * 20) {
                            return true;
                        }
                    }
                }
                return false;
            },

            createTranslateGesture: function (x, y) {
                ns.tr = true;
                ns.trx = x;
                ns.try = y;
            },
            stopTranslateGesture: function (e) {
                ns.tr = false;
            },
            moveTranslateGesture: function (x, y) {
                if (ns.tr) {
                    //dragOneTouches(ns.trx, ns.try, x, y, that.transform);
                    ns.trx = x;
                    ns.try = y;
                }
            }
        };

        this.canvasRation = 1;//window.devicePixelRatio;

        this._touchStartPuzzle = function (posx, posy, e) {
            var p = this.transform.getInvertPoint(posx, posy);
            posx = p[0];
            posy = p[1];

            var t = this.game.getOverElementAtPosition(posx, posy);
            this.dragElement = t == null ? null : t.element;
            this.dragElementInfo = t == null ? null : t.context;

            if (this.dragElement) {
                if (this.dragElement.isConnectedToBoard()) {
                    this.dragElement = null;
                }
                else {
                    this.game.bringToFront(this.dragElement);
                }
            }
        };
        this._touchEndPuzzle = function (posx, posy, e) {
            var p = this.transform.getInvertPoint(posx, posy);
            posx = p[0];
            posy = p[1];

            if (this.dragElement) {
                var dragInfo = this.dragElementInfo;
                var x = -dragInfo.startScreen.x + posx + dragInfo.startPosition.x;
                var y = -dragInfo.startScreen.y + posy + dragInfo.startPosition.y;

                this.game.trySetElementAtPosition(this.dragElement, x, y);
            }
            this.dragElement = null;
            this.dragElementInfo = null;
        };
        this._touchMovePuzzle = function (posx, posy, e) {
            var p = this.transform.getInvertPoint(posx, posy);
            posx = p[0];
            posy = p[1];

            if (this.dragElement) {
                this.dragElement.drag(posx, posy, this.dragElementInfo);
            }
        };

        this._debugMode = false;

        this.setDebugMode = function (value) {
            this._debugMode = value;

            if (this._debugMode === false) {
                this.mc.ctxs[0].width = this.mc.ctxs[0].width;
            }

            this.mc.isNeedLayersRedraw[3] = true;
            this.mc.isNeedLayersRedraw[1] = true;
            this.mc.isNeedLayersRedraw[0] = true;
        };

        this.mc = new MultiLayeredCanvas(4);
        this.mc.onDrawLayer0 = function (ctx, w, h, r, index, mc) {
            if (that._debugMode === true) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                mc.drawTimeline(ctx);
            }
        };
        this.mc.onDrawLayer1 = function (ctx, w, h, r, index, mc) {
            w *= r;
            h *= r;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, w, h);

            if (that._debugMode === true) {
                that.debugShape.draw(ctx,w,h,r);
            }
        };
        this.mc.onDrawLayer2 = function (ctx, w, h, r, index, mc) {

            if (1){//(!that.drawed) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, w, h);
            }

            var m = that.transform.matrix.m;
            ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 10, 10);

            if (1) {//(!that.drawed) {
                that.drawed = true;
                that.game.draw(ctx);
            }
            else {
                var el = that.game.findChangedPositionElement();
                if (el) {
                    if (el.prevPosition) {
                        // that.game._onElementChanged(el,ctx);
                        that.game.drawIntersected(el, ctx);
                    }
                }
            }
        };
        this.mc.onDrawLayer3 = function (ctx, w, h, r, index, mc) {
            w *= r;
            h *= r;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, w, h);

            if (that._debugMode === true) {
                var d = 100 * r;

                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.strokeStyle = 'rgba(50,50,50,.1)';
                ctx.lineWidth = r;
                ctx.beginPath();
                for (var i = d; i < w; i += d) {
                    ctx.moveTo(i + .5, 0);
                    ctx.lineTo(i + .5, h);
                }
                for (var j = d; j < h; j += d) {
                    ctx.moveTo(0, j + .5);
                    ctx.lineTo(w, j + .5);
                }
                ctx.stroke();
            }
        };
        this.mc.onUpdate = function (mc) {

            //mc.isNeedLayersRedraw[3] = true;

            if (checkAndSaveMatrix()) {
                that.drawed = false;
            }

            if (that._debugMode === true) {
                if (that.debugShape.isDirty()) {
                    mc.isNeedLayersRedraw[1] = true;
                }
            }

            if (!that.drawed || that.game.findChangedPositionElement()) {
                mc.isNeedLayersRedraw[2] = true;
            }

            if (mc.prevRender === undefined) {
                mc.prevRender = Date.now();
            }

            if (that._debugMode === true) {
                if ((Date.now() - mc.prevRender) > 60) {
                    if (that.debugShape.isDirty()) {
                        mc.isNeedLayersRedraw[0] = true;
                    }
                    mc.prevRender = Date.now();
                }
            }
        };
        this.mc.onChangeVisibility = function (isVisible) {
        };
        this.mc.onPostResize = function () {
            console.log('postresize');
            that.drawed = false;
        };

        this.mc.start();

        this.debugShape = new CanvasDebugShape(this.mc.canvasesParentElement);

        this._onMouseMove = function (e) {
            var lp = In.getLocalPosition(e);
            this._touchMovePuzzle(lp.x, lp.y, e);
        };
        this._onMouseUp = function (e) {
            var lp = In.getLocalPosition(e);
            this._touchEndPuzzle(lp.x, lp.y, e);
        };
        this._onMouseDown = function (e) {
            var lp = In.getLocalPosition(e);
            this._touchStartPuzzle(lp.x, lp.y, e);
        };
        this._onTouchStart = function (e) {
            e.preventDefault();

            var currentTouches = e.touches;

            if (currentTouches.length !== 1) {
                this.navigationState.stopTranslateGesture(e);
            }

            if (currentTouches.length === 1) {

                var lp = In.getLocalPositionTouch(e.touches[0]);
                // if(this.game.getOverElementAtPosition(lp.x, lp.y)!==null){
                this.navigationState.waitSecondTouch(300, this._touchStartPuzzle.bind(this, lp.x, lp.y, e), undefined, lp.x, lp.y);
                this.navigationState.stopTranslateGesture(e);
                // }
                //else{
                this.navigationState.createTranslateGesture(lp.x, lp.y);
                //  }
            }
            this.tpd = {};
            this.tpd.startTouchs = {};
            this.tpd.active = false;

            if (currentTouches.length > 1) {

                if (this.navigationState.cancelWaitSecondTouch()) {
                    this.tpd.active = true;
                    var startTouches = this.tpd.startTouchs;

                    for (var i = 0; i < currentTouches.length; i++) {
                        var t = currentTouches[i];
                        var lp = In.getLocalPositionTouch(t);
                        startTouches[t.identifier] = {x: lp.x, y: lp.y, id: t.identifier};
                    }
                }
            }
        };
        this._onTouchEnd = function (e) {
            e.preventDefault();

            if (e.touches.length !== 1) {
                this.navigationState.stopTranslateGesture(e);
            }
            else {
                var lp = In.getLocalPositionTouch(e.touches[0]);
                this.navigationState.createTranslateGesture(lp.x, lp.y);
            }

            if (e.touches.length < 2) {
                this.navigationState.forceWaitSecondTouch();
                if (this.navigationState.isFired()) {
                    var lp = In.getLocalPositionTouch(e.changedTouches[0]);
                    this._touchEndPuzzle(lp.x, lp.y, e);
                }
                this.navigationState.reset();
            }
            this.tpd = {};
            this.tpd.startTouchs = {};
            this.tpd.active = false;
            var currentTouches = e.touches;
            if (currentTouches.length > 1) {
                this.tpd.active = true;

                var startTouchs = this.tpd.startTouchs;
                for (var i = 0; i < currentTouches.length; i++) {
                    var t = currentTouches[i];
                    var po = In.getLocalPositionTouch(t);
                    startTouchs[t.identifier] = {x: po.x, y: po.y, id: t.identifier};
                }
            }
        };
        this._onTouchMove = function (e) {
            e.preventDefault();

            var currentTouches = e.touches;
            if (currentTouches.length < 2) {
                this.tpd.startTouchs = {};
                this.tpd.active = false;
            }

            if (!this.navigationState.isCanceled()) {

                var lp = In.getLocalPositionTouch(e.touches[0]);

                if (!this.navigationState.isFired()) {
                    if (this.navigationState.isRadiusEscape(lp.x, lp.y)) {
                        this.navigationState.forceWaitSecondTouch();
                    }
                }

                if (this.navigationState.isFired()) {
                    this._touchMovePuzzle(lp.x, lp.y, e);
                }
            }
            else {
                if (this.tpd.active == true) {

                    this.navigationState.stopTranslateGesture(e);

                    var startTouchs = this.tpd.startTouchs;
                    this.tpd.moveTouchs = {};
                    var moveTouchs = this.tpd.moveTouchs;

                    var ids = [];
                    for (var i = 0; i < currentTouches.length; i++) {
                        var t = currentTouches[i];
                        if (startTouchs[t.identifier] !== undefined) {
                            ids.push(t.identifier);
                        }
                        var lp = In.getLocalPositionTouch(t);
                        moveTouchs[t.identifier] = {x: lp.x, y: lp.y, id: t.identifier};
                    }

                    if (ids.length > 1) {
                        dragTwoTouches(
                            startTouchs[ids[0]].x, startTouchs[ids[0]].y, startTouchs[ids[1]].x, startTouchs[ids[1]].y,
                            moveTouchs[ids[0]].x, moveTouchs[ids[0]].y, moveTouchs[ids[1]].x, moveTouchs[ids[1]].y,
                            this.transform, true, true);
                    }
                    this.tpd.startTouchs = this.tpd.moveTouchs;
                    this.tpd.moveTouchs = {};

                }
            }

            if (currentTouches.length === 1) {
                var lp = In.getLocalPositionTouch(e.touches[0]);
                this.navigationState.moveTranslateGesture(lp.x, lp.y);
            }

        };
        this._onContextMenu = function (e) {
            e.preventDefault();
        };
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'mousemove', this, this._onMouseMove);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'mouseup', this, this._onMouseUp);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'mousedown', this, this._onMouseDown);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'touchstart', this, this._onTouchStart);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'touchend', this, this._onTouchEnd);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'touchmove', this, this._onTouchMove);
        In.subscribeOnEvent(this.mc.canvasesParentElement, "contextmenu", this, this._onContextMenu);
    };

    module.PuzzleApp = PuzzleApp;
});
})(window);

//@ sourceMappingURL=public\game.puzzle.pack.js.map
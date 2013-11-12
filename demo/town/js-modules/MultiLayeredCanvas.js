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
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
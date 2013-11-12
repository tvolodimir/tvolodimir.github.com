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
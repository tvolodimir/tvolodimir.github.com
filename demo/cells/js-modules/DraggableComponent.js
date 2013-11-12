defineModule('DraggableComponent', ['Transformations'], function (module, $r) {
    /**
     * @overview DraggableComponent module.
     */

    "use strict";

    var ViewTransformation = $r('Transformations').ViewTransformation;
    var TouchContainer = $r('Transformations').TouchContainer;

    /**
     * @class IContainer
     * @constructor
     */
    var IContainer = function IContainer () {
        this.parent = null;
    };
    IContainer.prototype.onMouseMove = function (/*Number[]*/p) {};
    IContainer.prototype.onMouseDown = function (/*Number[]*/p) {};
    IContainer.prototype.onMouseUp = function (/*Number[]*/p) {};
    IContainer.prototype.draw = function (/*CanvasRenderingContext2D*/ctx) {};

    /**
     * DraggableComponent
     * @param x
     * @param y
     * @param w
     * @param h
     * @param container
     * @constructor
     * @class DraggableComponent
     */
    var DraggableComponent = function DraggableComponent(x, y, w, h, container) {
        "use strict";

        this.viewport = [x, y, w, h];
        this.viewportInvert = [0, 0, w, h];

        /**
         * view transformation
         * @type {ViewTransformation}
         */
        this.transform = new ViewTransformation();

        /**
         * minimum value of the scale
         * @type {Number}
         */
        this.minscale = 0.2;

        /**
         * maximum value of the scale
         * @type {Number}
         */
        this.maxscale = 5;

        /**
         * dragEvent
         * @type {TouchContainer}
         */
        this._dragEvent = null;

        /**
         * conntainer
         * @type {IContainer}
         */
        this.conntainer = container ? container : new IContainer();
        this.conntainer.parent = this;
    };
    DraggableComponent.prototype.transformMouse = function (posx, posy) {
        "use strict";
        return this.transform.getInvertPoint(posx - this.viewport[0], posy - this.viewport[1]);
    };
    DraggableComponent.prototype.transformCanvas = function (ctx) {
        "use strict";
        var x = this.viewport[0];
        var y = this.viewport[1];
        var m = this.transform.matrix.m;
        ctx.transform(m[0], m[1], m[2], m[3], m[4] + x, m[5] + y);
    };
    DraggableComponent.prototype.onMouseMove = function (posx, posy, event) {
        "use strict";
        posx -= this.viewport[0];
        posy -= this.viewport[1];
        this.lastMouseX = posx;
        this.lastMouseY = posy;

        if (this._dragEvent) {
            this._dragEvent.onMove(posx, posy);
            return;
        }
        this.conntainer.onMouseMove(this.transform.getInvertPoint(posx, posy));
    };
    DraggableComponent.prototype.onMouseDown = function (posx, posy, event) {
        "use strict";
        posx -= this.viewport[0];
        posy -= this.viewport[1];
        this.lastMouseX = posx;
        this.lastMouseY = posy;

        this._dragEvent = new TouchContainer(posx, posy, this.transform);
    };
    DraggableComponent.prototype.onMouseUp = function (posx, posy, event) {
        "use strict";
        posx -= this.viewport[0];
        posy -= this.viewport[1];
        this.lastMouseX = posx;
        this.lastMouseY = posy;

        if (this._dragEvent) {
            if (this._dragEvent.grabLength(posx, posy) < 5) {
                var p = this.transform.getInvertPoint(posx, posy);
                this.conntainer.onMouseDown(p);
                this.conntainer.onMouseUp(p);
            }
            this._dragEvent = null;
        }
    };
    DraggableComponent.prototype.onWheel = function (delta, event) {
        var nscalex = (1 + delta * 0.25) * this.transform.scale;
        nscalex = Math.max(Math.min(this.maxscale, nscalex), this.minscale);

        if (this._dragEvent) {
            this._dragEvent.onScale(nscalex / this.transform.scale);
        }
        else {
            var p_local = [this.lastMouseX, this.lastMouseY];
            this.transform.zoom(nscalex / this.transform.scale, p_local);
        }
    };
    DraggableComponent.prototype.update = function () {
        "use strict";
        if (this._dragEvent) {
            this._dragEvent.updateViewPort();
        }
        this.transform.updateTransform();

        var w = this.viewport[2];
        var h = this.viewport[3];
        var p1 = this.transform.getInvertPoint(0, 0);
        var p2 = this.transform.getInvertPoint(w, h);
        this.viewportInvert = [p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]];
    };
    DraggableComponent.prototype.draw = function (ctx) {
        "use strict";

        // modify local matrix
        var x = this.viewport[0];
        var y = this.viewport[1];

        // modify matrix
        var m = this.transform.matrix.m;

        ctx.transform(m[0], m[1], m[2], m[3], x + m[4], y + m[5]);

        this.conntainer.draw(ctx);
    };

    /**
     * RectangleComponent
     * @param x
     * @param y
     * @param w
     * @param h
     * @constructor
     * @class RectangleComponent
     */
    var RectangleComponent = function RectangleComponent(x, y, w, h) {
        "use strict";
        this.viewport = [x, y, w, h];
        this.viewportInvert = [0, 0, w, h];

        this.transform = new ViewTransformation();
    };
    RectangleComponent.prototype.transformMouse = function (x, y) {
        "use strict";
        return this.transform.getInvertPoint(x - this.viewport[0], y - this.viewport[1]);
    };
    RectangleComponent.prototype.transformCanvas = function (ctx) {
        "use strict";
        var x = this.viewport[0];
        var y = this.viewport[1];
        var m = this.transform.matrix.m;
        ctx.transform(m[0], m[1], m[2], m[3], m[4] + x, m[5] + y);
    };

    module.DraggableComponent = DraggableComponent;
    module.RectangleComponent = RectangleComponent;
});

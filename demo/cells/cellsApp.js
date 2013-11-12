defineModule('CellsApp', ['DraggableComponent', 'Transformations', 'MultiLayeredCanvas', 'InputExtension', 'Colors'], function (module, $r) {
    /**
     * @overview CellApp module.
     */

    "use strict";

    var DraggableComponent = $r('DraggableComponent').DraggableComponent;
    var CellsVisibility = $r('Transformations').CellsVisibility;
    var MultiLayeredCanvas = $r('MultiLayeredCanvas').MultiLayeredCanvas;
    var In = $r('InputExtension').In;
    var Color = $r('Colors').Color;

    var CellBoard = function () {
        this.parent = null;
        this.d = 20;
        this.over = [0, 0];
        this.cv = new CellsVisibility();

        this.time = 0;
        //var d = this.d;
        //this.cl = new CanvasLayer(d,d);
        //var ctx = this.cl.ctx;
        //ctx.fillStyle = 'rgba(0,255,0,.3)';
        //ctx.fillRect(1, 1, d - 2, d - 2);
    };
    CellBoard.prototype = {
        constructor: CellBoard,
        onMouseMove: function (p) {
            var d = this.d;
            var x1 = Math.floor(p[0] / d);
            var y1 = Math.floor(p[1] / d);
            this.over = [x1, y1];
        },
        onMouseDown: function (p) {
        },
        onMouseUp: function (p) {
        },
        draw: function (ctx) {
            ctx.fillStyle = 'rgba(55,55,0,.1)';
            //ctx.fillRect(0, 0, 200, 200);

            // draw border from dragged transformation
            ctx.strokeStyle = 'rgba(255,0,0,.3)';

            this.cv.update(this.parent.transform, this.parent.viewport[2], this.parent.viewport[3], this.d);

            this.time += 0.005;
            //if(this.time>1)this.time=0;


            ctx.strokeStyle = 'rgba(0,0,0,.9)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(20, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 20);
            ctx.closePath();
            ctx.stroke();

            //var w = this.cv.viewport;
//    ctx.beginPath();
//    ctx.moveTo(w[0][0],w[0][1]);
//    ctx.lineTo(w[1][0],w[1][1]);
//    ctx.lineTo(w[2][0],w[2][1]);
//    ctx.lineTo(w[3][0],w[3][1]);
//    ctx.closePath();
//    ctx.stroke();

//    var x = (w[0][0] + w[1][0] + w[2][0] + w[3][0])/4;
//    var y = (w[0][1] + w[1][1] + w[2][1] + w[3][1])/4;
//    ctx.fillStyle = 'rgba(5,5,5,.5)';
//    ctx.fillRect(x -2.5,y -2.5,5,5);


//    var q = this.cv.bound;
//    ctx.beginPath();
//    ctx.moveTo(q[0][0],q[0][1]);
//    ctx.lineTo(q[0][0],q[1][1]);
//    ctx.lineTo(q[1][0],q[1][1]);
//    ctx.lineTo(q[1][0],q[0][1]);
//    ctx.closePath();
//    ctx.stroke();

            //var cl =this.cl;
            var d = this.d;
            var over = this.over;
            var time = this.time;
            this.cv.forEachVisible(function (i, j) {
                //cl.drawToContext(ctx,i * d, j * d);
                var dx = Math.cos(i / 20) * 0.5 + 0.5;
                var dy = Math.cos(j / 20) * 0.5 + 0.5;
                var dz = Math.cos(((i * i + j * j) * (i * i + j * j)) / 20) * 0.5 + 0.5;

                var tt = Math.cos(time * Math.PI * 2) * 0.5 + 0.5;

                var color = new Color([255 * dx, 255 * dy, 255 * dz], 1);
                ctx.fillStyle = color.hsv_factors([tt, 1, 1]).toRGBA(1);//'rgba(0,0,0,.3)';
                if (over[0] == i && over[1] == j) {
                    ctx.fillStyle = 'rgba(255,255,0,.5)';
                    ctx.fillRect(i * d + 1, j * d + 1, d - 2, d - 2);
                    return
                }
                ctx.fillRect(i * d, j * d, d, d);
            });
        }
    };

    var CellsApp = function () {
        var g = this;

        this.mc = new MultiLayeredCanvas(3);
        this.mc.start();

        this.padding = 50;
        this.dc = new DraggableComponent(this.padding, this.padding, this.mc.width - 2 * this.padding, this.mc.height - 2 * this.padding, new CellBoard());
        this.dc.minscale = .5;
        this.dc.maxscale = 10;

        this.mc.onDrawLayer1 = function (ctx, w, h) {
            var x = w / 2;
            var y = h / 2;
            ctx.fillStyle = 'rgba(5,5,5,.5)';
            ctx.fillRect(x - 2.5, y - 2.5, 5, 5);

            ctx.strokeStyle = 'rgba(5,5,5,.5)';
            ctx.strokeRect(g.padding, g.padding, w - 2 * g.padding, h - 2 * g.padding);
        };
        this.mc.onDrawLayer2 = function (ctx, w, h) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, w, h);
            g.dc.draw(ctx);
        };

        this.mc.onPreResize = function (w, h) {
            g.dc.viewport = [g.padding, g.padding, w - 2 * g.padding, h - 2 * g.padding];
        };
        this.mc.onUpdate = function (mc) {
            mc.isNeedLayersRedraw[2] = true;
            g.dc.update();
        };

        this.onMouseMove = function (e) {
            var lp = In.getLocalPosition(e);
            this.dc.onMouseMove(lp.x, lp.y, e);
        };
        this.onMouseDown = function (e) {
            var lp = In.getLocalPosition(e);
            this.dc.onMouseDown(lp.x, lp.y, e);
        };
        this.onMouseUp = function (e) {
            var lp = In.getLocalPosition(e);
            this.dc.onMouseUp(lp.x, lp.y, e);
        };
        this.onWheel = function (e) {
            var delta = In.getDeltaWheel(e);
            this.dc.onWheel(delta, e);
            return In.stopEvent(e);
        };

        In.subscribeOnEvent(this.mc.canvasesParentElement, 'mousemove', this, this.onMouseMove);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'mouseup', this, this.onMouseUp);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'mousedown', this, this.onMouseDown);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'DOMMouseScroll', this, this.onWheel);
        In.subscribeOnEvent(this.mc.canvasesParentElement, 'mousewheel', this, this.onWheel);
    };

    console.log('loaded');

    module.CellsApp = CellsApp;
});
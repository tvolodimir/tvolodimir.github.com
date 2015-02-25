
Drawer = {
    getMirrorPoint:function (x0, y0, nx, ny, x, y) {
        var rx = x0 - x;
        var ry = y0 - y;
        var dot = rx * nx + ry * ny;
        return [x + 2 * dot * nx, y + 2 * dot * ny];
    },
    drawFlipPage:function (ctx, images, width, height, x0, y0, nx, ny) {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#FFF';


        //console.log(nx,ny);
        // y1 = y0 + (x0 - x1) * nx / ny; x1 = x0 + (y0 - y1) * ny / nx;

        var angle = Math.atan2(nx, ny);
        var gamma = Math.PI - 2 * angle;

        var pp_inLine = [
            [(width - x0) * ny - (0 - y0) * nx, width, 0],
            [(width - x0) * ny - (height - y0) * nx, width, height],
            [(0 - x0) * ny - (0 - y0) * nx, 0, 0],
            [(0 - x0) * ny - (height - y0) * nx, 0, height]
        ];
        pp_inLine.sort(function (x, y) {
            return -x[0] + y[0];
        });

        var pp_toLine = [
            [(width - x0) * nx + (0 - y0) * ny, width, 0],
            [(width - x0) * nx + (height - y0) * ny, width, height],
            [(0 - x0) * nx + (0 - y0) * ny, 0, 0],
            [(0 - x0) * nx + (height - y0) * ny, 0, height]
        ];
        pp_toLine.sort(function (x, y) {
            return -x[0] + y[0];
        });

        // clip back part
        ctx.save();
        ctx.strokeStyle = "#0F0";
        ctx.beginPath();
        var d = Math.min(-pp_toLine[0][0], pp_toLine[3][0]);
        ctx.moveTo(x0 + ny * (pp_inLine[0][0] + 10), y0 - nx * (pp_inLine[0][0] + 10));
        ctx.lineTo(x0 + ny * (pp_inLine[3][0] - 10), y0 - nx * (pp_inLine[3][0] - 10));
        ctx.lineTo(x0 + ny * (pp_inLine[3][0] - 10) + (d- 10) * nx, y0 - nx * (pp_inLine[3][0] - 10) + (d - 10) * ny);
        ctx.lineTo(x0 + ny * (pp_inLine[0][0] + 10) + (d- 10) * nx, y0 - nx * (pp_inLine[0][0] + 10) + (d - 10) * ny);
        ctx.closePath();
        //ctx.stroke();
        ctx.clip();

        // draw gradient
        var p = pp_toLine[3];
        var gr = ctx.createLinearGradient(p[1], p[2], p[1] - p[0] * nx, p[2] - p[0] * ny);
//        gr.addColorStop(0.0, 'rgba(255,255,255,1)');
//        gr.addColorStop(.05, 'rgba(0,0,0,1)');
//        gr.addColorStop(.1, 'rgba(255,255,255,1)');
//        gr.addColorStop(.9, 'rgba(0,0,0,1)');
//        gr.addColorStop(.95, 'rgba(255,255,255,1)');
//        gr.addColorStop(1.0, 'rgba(0,0,0,1)');
        gr.addColorStop(0.0, 'rgba(255,255,255,.0)');
        gr.addColorStop(0.8, 'rgba(200,200,200,.0)');
        gr.addColorStop(0.85, 'rgba(255,255,255,.5)');
        gr.addColorStop(1.0, 'rgba(0,0,0,.8)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, width, height);


        var translatepoint = this.getMirrorPoint(x0, y0, nx, ny, width, 0);
        ctx.translate(translatepoint[0], translatepoint[1]);
        ctx.rotate(gamma);
        ctx.drawImage(images[4], 0, 0, width, height);


        if (ny > 0 && nx > 0) {
            ctx.save();
            gr = ctx.createLinearGradient(0, 0, pp_toLine[0][0] * ny, pp_toLine[0][0] * nx);
//        gr.addColorStop(0.0, 'rgba(255,255,255,1)');
//        gr.addColorStop(.05, 'rgba(0,0,0,1)');
//        gr.addColorStop(.1, 'rgba(255,255,255,1)');
//        gr.addColorStop(.9, 'rgba(0,0,0,1)');
//        gr.addColorStop(.95, 'rgba(255,255,255,1)');
//        gr.addColorStop(1.0, 'rgba(0,0,0,1)');
            gr.addColorStop(0.0, 'rgba(255,255,255,.0)');
            gr.addColorStop(0.7, 'rgba(200,200,200,.0)');
            gr.addColorStop(0.8, 'rgba(255,255,255,.3)');
            gr.addColorStop(1.0, 'rgba(0,0,0,.6)');
            ctx.fillStyle = gr;
            ctx.rotate(-Math.PI / 2);
            ctx.translate(-height, 0);
            ctx.fillRect(0, 0, height, width);
            ctx.restore();
        }
        else {
            p = pp_toLine[0];
            gr = ctx.createLinearGradient(width - p[1], p[2], width - p[1] + p[0] * nx, p[2] - p[0] * ny);
//            gr.addColorStop(0.0, 'rgba(255,255,255,1)');
//            gr.addColorStop(.05, 'rgba(0,0,0,1)');
//            gr.addColorStop(.1, 'rgba(255,255,255,1)');
//            gr.addColorStop(.9, 'rgba(0,0,0,1)');
//            gr.addColorStop(.95, 'rgba(255,255,255,1)');
//            gr.addColorStop(1.0, 'rgba(0,0,0,1)');
            gr.addColorStop(0.0, 'rgba(255,255,255,.0)');
            gr.addColorStop(0.7, 'rgba(200,200,200,.0)');
            gr.addColorStop(0.8, 'rgba(255,255,255,.3)');
            gr.addColorStop(1.0, 'rgba(0,0,0,.6)');
            ctx.fillStyle = gr;
            ctx.fillRect(0, 0, width, height);
        }

        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "#0F0";
        ctx.beginPath();
        ctx.moveTo(x0 + ny * (pp_inLine[0][0] + 10), y0 - nx * (pp_inLine[0][0] + 10));
        ctx.lineTo(x0 + ny * (pp_inLine[3][0] - 10), y0 - nx * (pp_inLine[3][0] - 10));
        ctx.lineTo(x0 + ny * (pp_inLine[3][0] - 10) + (pp_toLine[0][0]+ 10) * nx, y0 - nx * (pp_inLine[3][0] - 10) + (pp_toLine[0][0] + 10) * ny);
        ctx.lineTo(x0 + ny * (pp_inLine[0][0] + 10) + (pp_toLine[0][0]+ 10) * nx, y0 - nx * (pp_inLine[0][0] + 10) + (pp_toLine[0][0] + 10) * ny);
        ctx.closePath();
        //ctx.stroke();
        ctx.clip();
        ctx.fillStyle = "#0F0";

        ctx.drawImage(images[5], 0, 0, width, height);

        p = pp_toLine[0];
        gr = ctx.createLinearGradient(p[1], p[2], p[1] - p[0] * nx, p[2] - p[0] * ny);
//        gr.addColorStop(0.0, 'rgba(255,255,255,1)');
//        gr.addColorStop(.05, 'rgba(0,0,0,1)');
//        gr.addColorStop(.1, 'rgba(255,255,255,1)');
//        gr.addColorStop(.9, 'rgba(0,0,0,1)');
//        gr.addColorStop(.95, 'rgba(255,255,255,1)');
//        gr.addColorStop(1.0, 'rgba(0,0,0,1)');
        gr.addColorStop(0.0, 'rgba(255,255,255,.0)');
        gr.addColorStop(0.7, 'rgba(200,200,200,.0)');
        gr.addColorStop(0.8, 'rgba(255,255,255,.3)');
        gr.addColorStop(1.0, 'rgba(0,0,0,.6)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    },
    onMouseDownPositiontest:function (app, posx, posy) {
        if (((app.posx - posx) * app.nx + (app.posy - posy) * app.ny) < 0) {
            return null;
        }
        var lb = Drawer.getMirrorPoint(app.posx, app.posy, app.nx, app.ny, posx, posy);
        app.mirrorPoint = lb;
        return {
            onMove:function (posx, posy) {
                app.changed = true;

                app.mouseDownX = posx - 120 - app.item_width;
                app.mouseDownY = posy - 300;


                if (false) {
                    var connectedPoints = [
                        //0, // upper right
                        //1, // bottom right
                        2, // upper left
                        3  // bottom left
                    ];
                    var pp_toLine = [
                        [(app.width - app.posx) * app.nx + (0 - app.posy) * app.ny, app.width, 0],
                        [(app.width - app.posx) * app.nx + (app.height - app.posy) * app.ny, app.width, app.height],
                        [(0 - app.posx) * app.nx + (0 - app.posy) * app.ny, 0, 0],
                        [(0 - app.posx) * app.nx + (app.height - app.posy) * app.ny, 0, app.height]
                    ];
                    var p, dx, dy, d, ddx, ddy, dd;
                    for (var i = 0; i < connectedPoints.length; i++) {
                        p = pp_toLine[connectedPoints[i]];


                        ddx = app.mouseDownX - app.mirrorPoint[0];
                        ddy = app.mouseDownY - app.mirrorPoint[1];
                        dd = Math.sqrt(ddx * ddx + ddy * ddy);
                        if (dd < 20) {
                            this.mouseIsDown = false;
                            this.mousemoveevent = null;
                            return;
                        }
                        dx = p[1] - app.mirrorPoint[0];
                        dy = p[2] - app.mirrorPoint[1];
                        d = Math.sqrt(dx * dx + dy * dy);
                        var dot = dx * ddx / dd + dy * ddy / dd;
                        var t = .01;
                        if (dot / d < t) {
                            //dot/d = cos(d,dd);
                            var dot2 = ddx * dy - ddy * dx;
                            if (dot2 > 0) {
                                var cos = -t;
                                var sin = Math.sqrt(1 - t * t);
                                dot = -t * d;
                            }
                            else {
                                dot = t * d;
                                var cos = t;
                                var sin = Math.sqrt(1 - t * t);
                            }


                            app.mouseDownX = app.mirrorPoint[0] + 2 * dot * (cos * dx - sin * dy) / d;
                            app.mouseDownY = app.mirrorPoint[1] + 2 * dot * (sin * dx + cos * dy) / d;
                            continue;
                        }

                        if (app.debug) {
                            var ctx = app.context;
                            ctx.beginPath();
                            ctx.arc(p[1], p[2], d, 0, 2 * Math.PI, false);
                            ctx.closePath();
                            ctx.stroke();

                            ctx.beginPath();
                            ctx.moveTo(app.mirrorPoint[0], app.mirrorPoint[1]);
                            ctx.lineTo(app.mouseDownX, app.mouseDownY);
                            ctx.closePath();
                            ctx.stroke();

                            ctx.beginPath();
                            ctx.arc(app.mirrorPoint[0] + 2 * dot * ddx / dd, app.mirrorPoint[1] + 2 * dot * ddy / dd, 7, 0, 2 * Math.PI, false);
                            ctx.closePath();
                            ctx.stroke();

                            console.log('dot > 0 - %s, 2*dot < dd - %s', dot > 0, 2 * dot < dd);
                        }
                        if (dot > 0 && 2 * dot < dd) {
                            app.mouseDownX = app.mirrorPoint[0] + 2 * dot * ddx / dd;
                            app.mouseDownY = app.mirrorPoint[1] + 2 * dot * ddy / dd;
                        }

                        //            dx = this.mouseDownX - p[1];
                        //            dy = this.mouseDownY - p[2];
                        //            d = Math.sqrt(dx * dx + dy * dy);
                        //            ddx = this.mirrorPoint[0] - p[1];
                        //            ddy = this.mirrorPoint[1] - p[2];
                        //            dd = Math.sqrt(ddx * ddx + ddy * ddy);
                        //            if (dd < d) {
                        //                this.mouseDownX = p[1] + dx * dd / d;
                        //                this.mouseDownY = p[2] + dy * dd / d;
                        //                this.context.fillStyle='#0FF';
                        //                this.context.beginPath();
                        //                this.context.arc(this.mouseDownX,this.mouseDownY,5,0,2*Math.PI,false);
                        //                this.context.closePath();
                        //                this.context.fill();
                        //            }
                    }
                }

                var dx = lb[0] - app.mouseDownX;
                var dy = lb[1] - app.mouseDownY;
                var px = (lb[0] + app.mouseDownX) / 2;
                var py = (lb[1] + app.mouseDownY) / 2;
                var d = Math.sqrt(dx * dx + dy * dy);
                app.nx = dx / d;
                app.ny = dy / d;
                app.posx = px;
                app.posy = py;
                app.changed = true;

            },
            onUp:function (posx, posy) {
                app.changed = true;
            }
        }
    },
    drawBackground:function (ctx, width, height, item_width, item_height, image1, image2) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#eaeaea';
        ctx.strokeRect(1, 1, width - 2, height - 2);
        ctx.save();

        var gr0 = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.sqrt(width * width + height * height));
        gr0.addColorStop(1.0, 'rgba(148,136,114,1)');
        gr0.addColorStop(0.0, 'rgba(236,212,176,1)');
        ctx.fillStyle = gr0;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(236,212,176,1)';
        ctx.font = "72px Times New Roman";
        var gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(94,75,58,1)");
        gradient.addColorStop(1, "rgba(94,75,58,1)");
        ctx.fillStyle = gradient;
        ctx.textAlign = 'center';
        ctx.fillText("Flip pages Demo", width/2, 170);
        ctx.restore();

        // test (line)
//        ctx.fillStyle = "rgba(94,75,58,1)";
//        ctx.beginPath();
//        ctx.lineWidth = 1.5;
//        ctx.moveTo(100, 900);
//        ctx.lineTo(0, 0);
//        ctx.closePath();
//        ctx.stroke();

        ctx.translate((width-2*item_width)*.5, 300);

        // draw left shadow
        ctx.save();
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(154,118,82,1)';
        ctx.fillStyle = "#8ED6FF";
        ctx.fillRect(0, 0, item_width, item_height);
        ctx.restore();

        // draw left page
        ctx.drawImage(image1, 0, 0, item_width, item_height);

        // draw left page gradient
        var gr = ctx.createLinearGradient(0, 0, item_width, 0);
        gr.addColorStop(0.0, 'rgba(200,200,200,0.1)');
        gr.addColorStop(0.5, 'rgba(255,255,255,0.3)');
        gr.addColorStop(0.8, 'rgba(255,255,255,0.4)');
        gr.addColorStop(0.9, 'rgba(200,200,200,0.4)');
        gr.addColorStop(1.0, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, item_width, item_height);

        ctx.translate(item_width, 0);

        // draw right shadow
        ctx.save();
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(154,118,82,1)';
        ctx.fillStyle = "#8ED6FF";
        ctx.fillRect(0, 0, item_width, item_height);
        ctx.restore();

        // draw right page
        ctx.drawImage(image2, 0, 0, item_width, item_height);

        // draw right page gradient
        ctx.save();
        gr = ctx.createLinearGradient(0, 0, item_width, 0);
        gr.addColorStop(1.0, 'rgba(200,200,200,0.1)');
        gr.addColorStop(0.5, 'rgba(255,255,255,0.3)');
        gr.addColorStop(0.2, 'rgba(255,255,255,0.4)');
        gr.addColorStop(0.1, 'rgba(200,200,200,0.4)');
        gr.addColorStop(0.0, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, item_width, item_height);
        ctx.restore();
    }
};

Storage = {
    imageData:{
        'b1':{src:'content/6.jpg'},
        'b2':{src:'content/1.jpg'},
        'b3':{src:'content/1.jpg'},
        'b4':{src:'content/4.jpg'},
        'b5':{src:'content/5.jpg'},
        'b6':{src:'content/2.jpg'}
    }
};

FlipPagesApp = function () {
    this.__proto__ = new App({
        loadList:[
            Storage.imageData.b1, Storage.imageData.b2,
            Storage.imageData.b3, Storage.imageData.b4,
            Storage.imageData.b5, Storage.imageData.b6],
        canvasCount:3,
        defSize:[800,600]
    });
    this.context = this.ctxs[1];// default context TODO fix
    this.dragEvent = null;

    this.debug = true;
    this.changed = true;
    this.item_width = 320;
    this.item_height = 200;
    this.offsetdx = (this.width-2* this.item_width)*.5;
    this.nx = Math.cos(-Math.PI / 19);
    this.ny = Math.sin(-Math.PI / 19);
    this.posx = 228.5;
    this.posy = 178;
    this.mirrorPoint = [];

    this.target = {angle:0,posx:this.item_width};
    TWEEN.start();
    this.animate = new TWEEN.Tween(this.target)
        .delay(100)
        .to({angle:Math.PI * .05,posx:this.item_width*.2},1000);
    this.animate.start();

    this.drawLayer2 = function (ctx, width, height) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.strokeStyle = '#eaeaea';
        ctx.strokeRect(1, 1, this.width - 2, this.height - 2);
        ctx.save();
        Drawer.drawBackground(ctx,
            this.width, this.height,
            this.item_width, this.item_height,
            Storage.imageData.b3.data, Storage.imageData.b4.data);
        ctx.restore();
    };
    this.drawLayer1 = function (ctx, width, height) {

        ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.translate(this.offsetdx, 300);
        ctx.translate(this.item_width, 0);
        ctx.save();
        try{
        Drawer.drawFlipPage(ctx, [
            Storage.imageData.b1.data, Storage.imageData.b2.data,
            Storage.imageData.b3.data, Storage.imageData.b4.data,
            Storage.imageData.b5.data, Storage.imageData.b6.data],
            this.item_width, this.item_height,
            this.posx, this.posy,
            this.nx, this.ny);
        }
        catch(er){
            console.log(this.posx, this.posy,
                        this.nx, this.ny,er);
            throw er;
        }
        ctx.restore();

        if (this.debug) {
            ctx.fillStyle = '#F0F';
            ctx.beginPath();
            ctx.arc(this.mirrorPoint[0], this.mirrorPoint[1], 5, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.posx, this.posy, 5, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.mouseDownX, this.mouseDownY, 5, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    };
    this.update = function () {
        this.isNeedLayersRedraw[0] = true;
        //this.isNeedLayersRedraw[1] = true;
        //this.isNeedLayersRedraw[2] = true;

        if (!this.mouse.isDown) {
            if (this.animate == null || this.animate._done) {
                var sourceAngle = Math.atan2(this.ny, this.nx);
                var destAngle = (Math.abs(-Math.PI / 2 - sourceAngle) > Math.abs(0 - sourceAngle)) ? 0 : -Math.PI / 2;
                // y1 = y0 + (x0 - x1) * nx / ny; x1 = x0 + (y0 - y1) * ny / nx;
                var sourceX = this.posx + (this.posy - 0) * this.ny / this.nx;
                if (sourceX > 1 || (sourceX + 1) < this.item_width) {
                    var destX = (this.posx < this.item_width / 2) ? 0 : this.item_width;
                    this.target = {angle:sourceAngle, posx:sourceX};
                    this.animate = new TWEEN.Tween(this.target)
                        .to({angle:destAngle, posx:destX}, 1000)
                        .start();
                }
            }
            else if (this.animate != null) {
                this.posx = this.target.posx;
                this.posy = 0;
                var angle = this.target.angle;
                this.nx = Math.cos(angle);
                this.ny = Math.sin(angle);
                this.changed = true;

                if (this.animate._done)this.animate = null;
            }
        }

        if (this.changed) {
            this.isNeedLayersRedraw[1] = true;
            this.changed = false;
        }
    };

    this.onMouseMove = function (posx, posy, event) {
        this.__proto__.onMouseMove(posx, posy, event);
        if (this.dragEvent != null) {
            this.dragEvent.onMove(posx, posy, event);
        }
    };
    this.onMouseUp = function (posx, posy, event) {
        this.__proto__.onMouseUp(posx, posy, event);
        if (this.dragEvent != null) {
            this.dragEvent.onUp(posx, posy, event);
            this.dragEvent = null;
        }
    };
    this.onMouseDown = function (posx, posy, event) {
        this.__proto__.onMouseDown(posx, posy, event);
        this.animate = null;
        this.mouseDownX = posx -  this.offsetdx - this.item_width;
        this.mouseDownY = posy - 300;
        this.dragEvent = Drawer.onMouseDownPositiontest(this, this.mouseDownX, this.mouseDownY);
    };
};
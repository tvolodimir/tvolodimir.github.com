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
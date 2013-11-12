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
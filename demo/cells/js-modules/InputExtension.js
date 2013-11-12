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
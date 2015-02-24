/**
 * Created by tvolodimir. 2011.
 * tvolodimir@gmail.com
 */

var MicroEvent = function(){};
MicroEvent.prototype = {
    subscribe: function(event, fct) {
        this._events = this._events || {};
        this._events[event] = this._events[event]	|| [];
        this._events[event].push(fct);
        return this;
    }

    , unsubscribe: function(event, fct) {
        this._events = this._events || {};

        if(event in this._events !== false) {
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        }

        return this;
    }

    , publish: function(event /*, args... */) {
        this._events = this._events || {};

        if(event in this._events !== false)	{
            for(var i = 0; i < this._events[event].length; i++){
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }

        return this;
    }
};

if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elem) {
        for(var i = 0, length = this.length; i < length; ++i) {
            if(this[i] === elem) { return i; }
        }
        return -1;
    };
}

MicroEvent.mixin = function(destObject) {
    var props	= ['subscribe', 'unsubscribe', 'publish'];
    for(var i = 0; i < props.length; i++){
        destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
    }
};

ArithmeticMean = function (iterToLocal) {
    if (iterToLocal !== undefined)
        this.iterToLocal = iterToLocal;
    else
        this.iterToLocal = 50;
    this.min = 9999;
    this.max = 0;
    this.avg = 0;
    this.count = 0;
};
ArithmeticMean.prototype = {
    log:function () {
        console.log('min %s, max %s, avg %s', this.min, this.max, this.avg);
    },
    updateIterationDelta:function (delta) {
        this.min = Math.min(this.min, delta);
        this.max = Math.max(this.max, delta);
        this.avg = (this.avg * this.count + delta) / (this.count + 1);
        this.count++;
        if (this.count > this.iterToLocal) {
            this.count = 1;
            this.min = this.avg;
            this.max = this.avg;
        }
    },
    clear:function () {
        this.min = 9999;
        this.max = 0;
        this.avg = 0;
        this.count = 0;
    }
};

Keys = {
    backspace:8,
    tab:9,
    enter:13,
    shift:16,
    ctrl:17,
    alt:18,
    pause_break:19,
    caps_lock:20,
    escape:27,
    space:32,
    page_up:33,
    page_down:34,
    end:35,
    home:36,
    left_arrow:37,
    up_arrow:38,
    right_arrow:39,
    down_arrow:40,
    insert:45,
    delete:46,
    0:48,
    1:49,
    2:50,
    3:51,
    4:52,
    5:53,
    6:54,
    7:55,
    8:56,
    9:57,
    a:65,
    b:66,
    c:67,
    d:68,
    e:69,
    f:70,
    g:71,
    h:72,
    i:73,
    j:74,
    k:75,
    l:76,
    m:77,
    n:78,
    o:79,
    p:80,
    q:81,
    r:82,
    s:83,
    t:84,
    u:85,
    v:86,
    w:87,
    x:88,
    y:89,
    z:90,
    left_window_key:91,
    right_window_key:92,
    select_key:93,
    numpad_0:96,
    numpad_1:97,
    numpad_2:98,
    numpad_3:99,
    numpad_4:100,
    numpad_5:101,
    numpad_6:102,
    numpad_7:103,
    numpad_8:104,
    numpad_9:105,
    multiply:106,
    add:107,
    subtract:109,
    decimal_point:110,
    divide:111,
    f1:112,
    f2:113,
    f3:114,
    f4:115,
    f5:116,
    f6:117,
    f7:118,
    f8:119,
    f9:120,
    f10:121,
    f11:122,
    f12:123,
    num_lock:144,
    scroll_lock:145,
    semi_colon:186,
    equal_sign:187,
    comma:188,
    dash:189,
    period:190,
    forward_slash:191,
    grave_accent:192,
    open_bracket:219,
    back_slash:220,
    close_braket:221,
    single_quote:222
};

App = function (config) {
    this.cnvs = [];
    this.ctxs = [];
    this.fpsLayers = [];
    this.isNeedLayersRedraw = [];
    this.canvasCount = 4;
    if(config && config.canvasCount){
        this.canvasCount = config.canvasCount;
    }
    this.defSize = [800, 600];
    if (config && config.defSize) {
        this.defSize = config.defSize;
    }
    for (var i = 0; i < this.canvasCount; i++){
        this.cnvs[i] = document.getElementById('layer' + i);
        this.ctxs[i] = this.cnvs[i].getContext("2d");
        this.fpsLayers[i] = new ArithmeticMean();
        this.isNeedLayersRedraw[i] = true;
        this['drawLayer' + i] = this['drawLayer' + i] ? this['drawLayer' + i] : (function (ctx, width, height) { });
    }

    this.width = this.cnvs[0].width;
    this.height = this.cnvs[0].height;
    this.mouse = {
        isDown:false,
        lastDownX:-1,
        lastDownY:-1,
        lastX:-1,
        lastY:-1,
        lastUpX:-1,
        lastUpY:-1,
        lastDownRightX:-1,
        lastDownRightY:-1,
        lastDownMiddleX:-1,
        lastDownMiddleY:-1,
        lastDownLeftX:-1,
        lastDownLeftY:-1,
        lastUpRightX:-1,
        lastUpRightY:-1,
        lastUpMiddleX:-1,
        lastUpMiddleY:-1,
        lastUpLeftX:-1,
        lastUpLeftY:-1,
        isDownRight:false,
        isDownMiddle:false,
        isDownLeft:false
    };
    this.keys = {};//pressed keys
    this.keytimes = {};//time pressed
    this.keypressedtimes = {};// total time pressed
    this.keypressedtimes[Keys.w] = 0;
    this.keypressedtimes[Keys.a] = 0;
    this.keypressedtimes[Keys.d] = 0;
    this.keypressedtimes[Keys.s] = 0;

    this.fpsUpdate = new ArithmeticMean();
    this.fpsTotal = new ArithmeticMean();
    this.fpsReal = new ArithmeticMean();
    this.prewrendertime = Number(Date.now());

    if (!config) config = {};
    this.loadList = config.loadList ? config.loadList : [];
    this.loader = new Loader(this.loadList);
    this.isStopAnimloop = true;

    this.input = new Input({
        canvas:this.cnvs[0],
        onMouseMove:this.onMouseMove.bind(this),
        onMouseDown:this.onMouseDown.bind(this),
        onMouseUp:this.onMouseUp.bind(this),
        onContextMenu:this.onContextMenu.bind(this),
        onKeyDown:this.onKeyDown.bind(this),
        onKeyUp:this.onKeyUp.bind(this),
        onBlur:this.onBlur.bind(this),
        onKeyPress:this.onKeyPress.bind(this),
        //onWheel:this.onWheel.bind(this)
    });
};
App.prototype.onChangeVisibility = function(isVisisble){
    if(isVisisble){
        console.log('@ app.visible.');
    }
    else{
        console.log('@ app.hidden.');
    }
};
App.prototype.initvisibilitychange = function(){
    function handleVisibilityChange() {
        this.isVisible = !(document.webkitHidden || document.hidden);
        this.onChangeVisibility(this.isVisible);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange.bind(this), false);
    document.addEventListener("webkitvisibilitychange", handleVisibilityChange.bind(this), false);
    this.isVisible = !(document.webkitHidden || document.hidden);
    if (this.isVisible) this.onChangeVisibility(this.isVisible);
    // (document.webkitVisibilityState != "prerender")
};

App.prototype.resize = function(width,height) {
    for (var i = 0; i < this.canvasCount; i++) {
        this.cnvs[i].style.width = this.cnvs[i].width = width;
        this.cnvs[i].style.height = this.cnvs[i].height = height;
        this.isNeedLayersRedraw[i] = true;
    }
    this.width = width;
    this.height = height;
};
App.prototype.full = function() {
    var el = document.getElementById('canvasesdiv');
    if(el.webkitRequestFullScreen) {
        el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    else if (el.mozRequestFullScreenWithKeys) {
        el.mozRequestFullScreenWithKeys();
    } else {
        console.log('@ app.warning RequestFullScreen disabled');
    }
};
App.prototype.start = function () {
    console.log('@ app.starting.');

    function on_fullscreen_change() {
        if(document.mozFullScreen || document.webkitIsFullScreen) {
            var rect = document.getElementById('canvasesdiv').getBoundingClientRect();
            this.resize(rect.width,rect.height);

            //navigator.pointer = navigator.pointer || navigator.webkitPointer;
            //navigator.pointer.lock(this.canvas, function() {
            //}, onError);
            //var onError = function() {
            //    console.log("Mouse lock was not successful.");
            //};
        }
        else {
            this.resize(this.defSize[0],this.defSize[1]);
        }
    }
    window.addEventListener('resize', on_fullscreen_change.bind(this),false);
    document.addEventListener('mozfullscreenchange', on_fullscreen_change.bind(this),false);
    document.addEventListener('webkitfullscreenchange', on_fullscreen_change.bind(this),false);
    document.body.addEventListener('webkitpointerlocklost', function(e) { }, false);

    this.initvisibilitychange();

    if(!this.isStopAnimloop) return;
    this.isStopAnimloop = false;
    this.bindAt(this);
    if (this.loader.loaded) {
        console.log('@ app.loading_resources: nothing to load.');
        this.animloop();
    }
    else {
        console.log('@ app.loading_resources.');
        this.loader.load(this.onLoadResourcesCallback.bind(this));
    }
};
App.prototype.stopAnimLoop = function(){
    this.isStopAnimloop = true;
};
App.prototype.bindAt = function(that){
    this.input.onMouseMove_cb = that.onMouseMove.bind(that);
    this.input.onMouseDown_cb = that.onMouseDown.bind(that);
    this.input.onMouseUp_cb = that.onMouseUp.bind(that);
    this.input.onContextMenu_cb = that.onContextMenu.bind(that);
    this.input.onKeyDown_cb = that.onKeyDown.bind(that);
    this.input.onKeyUp_cb = that.onKeyUp.bind(that);
    this.input.onBlur_cb = that.onBlur.bind(that);
    this.input.onKeyPress_cb = that.onKeyPress.bind(that);
    this.input.onWheel_cb = that.onWheel.bind(that);
};
App.prototype.onLoadResourcesCallback = function () {
    console.log('@ app.start_animloop');
    this.animloop();
};
App.prototype.animloop = function () {
    this.draw();
    if (this.isStopAnimloop) return;
    requestAnimFrame(this.animloop.bind(this), this.canvas);
};
App.prototype.draw = function () {
    var start,startTotal;

    startTotal = start = Number(Date.now());
    this.fpsReal.updateIterationDelta(startTotal-this.prewrendertime);

    this.update();
    this.fpsUpdate.updateIterationDelta(Number(Date.now()) - start);

    for(var i = this.canvasCount-1; i>=0;i--){
        if (this.isNeedLayersRedraw[i]) {
            start = Number(Date.now());
            this['drawLayer'+i](this.ctxs[i], this.width, this.height);
            this.fpsLayers[i].updateIterationDelta(Number(Date.now()) - start);
            this.isNeedLayersRedraw[i] = false;
        }
        else{
            this.fpsLayers[i].updateIterationDelta(0);
        }
    }
    this.fpsTotal.updateIterationDelta(Number(Date.now()) - startTotal);
    this.prewrendertime = Number(Date.now());
};
App.prototype.drawLayer0 = function (ctx, width, height) {
    //ctx.clearRect(0, 0, 300, 300);
    ctx.clearRect(0,0,width, height);
    var i=0;
    var step = 10;
    var print = function (string) { ctx.fillText(string, 0, step * (++i)); };
    ctx.save();
    ctx.translate(0,0);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,90,105);
    ctx.globalAlpha = 0.9;
    ctx.font = "11px Courier";
    ctx.fillStyle = '#de8888';
    print('update: '+this.fpsUpdate.avg.toFixed(1));
    for (var j = 0; j < this.canvasCount; j++)
        print('layer'+j+': '+this.fpsLayers[j].avg.toFixed(1));
    print('total : '+this.fpsTotal.avg.toFixed(1));
    print('invoke: '+this.fpsReal.avg.toFixed(1));
    print('total : '+(this.fpsTotal.avg+this.fpsReal.avg).toFixed(1));
    print('fps   : '+(1000/(this.fpsTotal.avg+this.fpsReal.avg)).toFixed(1));
    ctx.restore();
};
App.prototype.update = function () {
    for(var i = 0; i<this.canvasCount;i++){
        this.isNeedLayersRedraw[i]=true;
    }
};
App.prototype.onMouseMove = function (posx, posy, event) {
    this.mouse.lastX = posx;
    this.mouse.lastY = posy;
    if (this.mouse.event != null) {
        this.mouse.event.onmove(this.mouse.lastX, this.mouse.lastY);
    }
};
App.prototype.onMouseDown = function (posx, posy, event) {
    var m = this.mouse;
    m.lastX = posx;
    m.lastY = posy;
    m.lastDownX = posx;
    m.lastDownY = posy;
    m.isDown = true;
    if ((event.which == 3) || (event.button == 2)) {
        m.isDownRight  = true;
        m.lastDownRightX = posx;
        m.lastDownRightY = posy;
    }
    if ((event.which == 2) || (event.button == 1)) {
        m.isDownMiddle = true;
        m.lastDownMiddleX = posx;
        m.lastDownMiddleY = posy;
    }
    if ((event.which == 1) || (event.button == 0)) {
        m.isDownLeft = true;
        m.lastDownLeftX = posx;
        m.lastDownLeftY = posy;
    }
};
App.prototype.onMouseUp = function (posx, posy, event) {
    var m = this.mouse;
    m.lastX = posx;
    m.lastY = posy;
    m.lastUpX = posx;
    m.lastUpY = posy;
    if ((event.which == 3) || (event.button == 2)) {
        m.isDownRight = false;
        m.lastUpRightX = posx;
        m.lastUpRightY = posy;
    }
    if ((event.which == 2) || (event.button == 1)) {
        m.isDownMiddle = false;
        m.lastUpMiddleX = posx;
        m.lastUpMiddleY = posy;
    }
    if ((event.which == 1) || (event.button == 0)) {
        m.isDownLeft = false;
        m.lastUpLeftX = posx;
        m.lastUpLeftY = posy;
    }
    if (!m.isDownLeft && !m.isDownMiddle && !m.isDownRight) {
        m.isDown = false;
    }
};
App.prototype.onContextMenu = function(posx, posy, event) {};
App.prototype.onKeyDown = function(key) {
    if (this.keys[key]) return;
    this.keys[key] = true;
    this.keytimes[key] = Number(Date.now());
};
App.prototype.onKeyUp = function(key) {
    if (!this.keys[key])return;
    this.keys[key] = false;
    this.keypressedtimes[key] += Number(Date.now()) - this.keytimes[key];
};
App.prototype.onKeyPress = function(key,char1) { };
App.prototype.onBlur = function () {
    var now;
    for (var key in this.keys) {
        if (this.keys[key]) {
            this.keys[key] = false;
            if (!now) now = Number(Date.now());
            this.keypressedtimes[key] += now - this.keytimes[key];
        }
    }

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
App.prototype.onWheel = function(delta, event) { };
App.prototype.UpdateKeyboard = function(){
    var now = Number(Date.now());
    for (var key in this.keys) {
        if (this.keys[key]) {
            this.keypressedtimes[key] += now - this.keytimes[key];
            this.keytimes[key] = now;
        }
    }
};
MicroEvent.mixin(App);

Input = function (config) {
    this.targetCanvas = config.canvas;
    if (config.onMouseMove) {
        this.onMouseMove_cb = config.onMouseMove;
        this.mouseMoveHandler = this.mouseMove.bind(this);
        this.targetCanvas.addEventListener("mousemove", this.mouseMoveHandler, false);
    }
    if (config.onMouseDown) {
        this.onMouseDown_cb = config.onMouseDown;
        this.mouseDownHandler = this.mouseDown.bind(this);
        this.targetCanvas.addEventListener("mousedown", this.mouseDownHandler, false);
    }
    if (config.onMouseUp) {
        this.onMouseUp_cb = config.onMouseUp;
        this.mouseUpHandler = this.mouseUp.bind(this);
        this.targetCanvas.addEventListener("mouseup", this.mouseUpHandler, false);
    }

    if (config.onKeyUp) {
        this.onKeyUp_cb = config.onKeyUp;
        this.keyUpHandler = this.keyUp.bind(this);
        window.addEventListener("keyup", this.keyUpHandler, false);
    }
    if (config.onKeyDown) {
        this.onKeyDown_cb = config.onKeyDown;
        this.keyDownHandler = this.keyDown.bind(this);
        window.addEventListener("keydown", this.keyDownHandler, false);
    }
    if (config.onKeyPress) {
        this.onKeyPress_cb = config.onKeyPress;
        this.keyPressHandler = this.keyPress.bind(this);
        window.addEventListener("keypress", this.keyPressHandler, false);
    }


    this.touchStartHandler = this.touchStart.bind(this);
    this.targetCanvas.addEventListener("touchstart", this.touchStartHandler, false);
    this.touchMoveHandler = this.touchMove.bind(this);
    this.targetCanvas.addEventListener("touchmove", this.touchMoveHandler, false);
    this.touchEndHandler = this.touchEnd.bind(this);
    this.targetCanvas.addEventListener("touchend", this.touchEndHandler, false);

    if (config.onTouchStart) {
        this.onTouchStart_cb = config.onTouchStart;
        this.touchStartHandler = this.touchStart.bind(this);
        this.targetCanvas.addEventListener("touchstart", this.touchStartHandler, false);
    }
    if (config.onTouchMove) {
        this.onTouchMove_cb = config.onTouchMove;
        this.touchMoveHandler = this.touchMove.bind(this);
        this.targetCanvas.addEventListener("touchmove", this.touchMoveHandler, false);
    }
    if (config.onTouchEnd) {
        this.onTouchEnd_cb = config.onTouchEnd;
        this.touchEndHandler = this.touchEnd.bind(this);
        this.targetCanvas.addEventListener("touchend", this.touchEndHandler, false);
    }

    this.touchPosition = null;

    if (config.onBlur) {
        this.onBlur_cb = config.onBlur;
        this.blurHandler = this.blur.bind(this);
        window.addEventListener('blur', this.blurHandler, false);
    }

    if (config.onContextMenu) {
        this.onContextMenu_cb = config.onContextMenu;
        this.contextmenuHandler = this.contextmenu.bind(this);
        this.targetCanvas.addEventListener("contextmenu", this.contextmenuHandler, false);
    }

    if (config.onWheel){
        this.onWheel_cb = config.onWheel;
        this.wheelHandler = this.wheel.bind(this);
        if (window.addEventListener)
            window.addEventListener('DOMMouseScroll', this.wheelHandler, false);
        window.onmousewheel = document.onmousewheel = this.wheelHandler;
    }
//    this.targetCanvas.addEventListener("mouseover", this.mouseOverHandler, false);
//    this.targetCanvas.addEventListener("mouseout", this.mouseOutHandler, false);
//    this.targetCanvas.addEventListener("click", this.clickHandler, false);
//    this.targetCanvas.addEventListener("dblclick", this.dblclickHandler, false);

    this.isWebKit = typeof navigator.userAgent.split("WebKit/")[1] !== "undefined";
    this.isMozilla = navigator.appVersion.indexOf('Gecko/') >= 0 || ((navigator.userAgent.indexOf("Gecko") >= 0) && !this.isWebKit && (typeof navigator.appVersion !== "undefined"));

    this.handledKeyDownKeys = [
        Keys.left_arrow, Keys.right_arrow, Keys.up_arrow, Keys.down_arrow,
        Keys.w, Keys.a, Keys.s , Keys.d,
        Keys.tab , Keys.t, Keys.z, Keys.x, Keys.escape, Keys.space];
};
Input.prototype.wheel = function (e) {
    if (!e) var e = window.event;
    var delta = 0;
    if (e.wheelDelta) {
        delta = e.wheelDelta / 120;
        if (window.opera) delta = -delta;
    } else if (e.detail) {
        delta = -e.detail / 3;
    }
    if (delta)
        this.onWheel_cb(delta, e);
    e.preventDefault();
};
Input.prototype.mouseDown = function (e) {
    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if(e.offsetX || e.offsetY){
        posx = e.offsetX;
        posy = e.offsetY;
    }
    else if(e.layerX || e.layerY){
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
    this.onMouseDown_cb(posx, posy, e);
    e.preventDefault();
};
Input.prototype.mouseUp = function (e) {
    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if(e.offsetX || e.offsetY){
        posx = e.offsetX;
        posy = e.offsetY;
    }
    else if(e.layerX || e.layerY){
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
    this.onMouseUp_cb(posx, posy, e);
    e.preventDefault();
};
Input.prototype.mouseMove = function (e) {

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
            this.onMouseMove_cb(this.lockedX, this.lockedY, e);
            return;
        }
    }

    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if(e.offsetX || e.offsetY){
        posx = e.offsetX;
        posy = e.offsetY;
    }
    else if(e.layerX || e.layerY){
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
    this.onMouseMove_cb(posx, posy, e);

    if (e.preventDefault)
    {
        e.preventDefault();
        e.returnValue= false;}
    else
        e.returnValue= false;
    return false
};
Input.prototype.stopEvent = function (e) {
    e.preventDefault();
    e.stopPropagation();
};
Input.prototype.keyDown = function(e) {
    if (/*!this.isMozilla && */!e.ctrlKey && !e.altKey && !e.altKey && !e.metaKey) {
        this.processKey(e, e.keyCode, null);
    }
};
Input.prototype.keyPress = function(e) {
    this.onKeyPress_cb(e.keyCode, Input.prototype.getChar(e));
    if (/*this.isMozilla && */!e.ctrlKey && !e.altKey && !e.altKey && !e.metaKey) {
        this.processPress(e, (e.keyCode != 0) ? e.keyCode : (e.charCode === 32) ? 32 : 0, Input.prototype.getChar(e));
    }

};
Input.prototype.getChar = function (event) {
    // event.type ������ ���� keypress
    //log(event.keyCode,event.charCode,event.which);
    if (event.which == null) {
        return String.fromCharCode(event.keyCode) // IE
    } else if (event.which != 0 && event.charCode != 0) {
        return String.fromCharCode(event.which)   // ���������
    } else {
        return null; // ����������� �������
    }
};
Input.prototype.keyUp = function (e) {
    for(var i=0;i<this.handledKeyDownKeys.length;i++){
        if(e.keyCode==this.handledKeyDownKeys[i]){
            this.stopEvent(e);
            this.onKeyUp_cb(e.keyCode);
        }
        this.stopEvent(e);
    }
};
Input.prototype.processKey = function (e, keyCode, char1) {
    for (var i = 0; i < this.handledKeyDownKeys.length; i++) {
        if (e.keyCode == this.handledKeyDownKeys[i]) {
            this.stopEvent(e);
            this.onKeyDown_cb(e.keyCode, char1);
        }
    }
};
Input.prototype.processPress = function (e, keyCode, char1) {
    for(var i=0;i<this.handledKeyDownKeys.length;i++){
        if(e.keyCode==this.handledKeyDownKeys[i]){
            this.stopEvent(e);
            this.onKeyPress_cb(e.keyCode, null);
        }
    }
};
Input.prototype.touchStart = function(e) {
    e.preventDefault();
    for (var i = 0; i < e.touches.length; i++) {
        //this.touchPosition = new Position(e.touches[i].pageX, e.touches[i].pageY);
    }
    if(e.touches.length>0)
        this.onMouseDown_cb(e.touches[0].pageX, e.touches[0].pageY, e);
};
Input.prototype.touchMove = function(e) {
    e.preventDefault();
    for (var i = 0; i < e.touches.length; i++) {
        if (this.touchPosition !== null) {
            var x = e.touches[i].pageX;
            var y = e.touches[i].pageY;
        }
    }
    if( e.touches.length>0)
        this.onMouseMove_cb(e.touches[0].pageX, e.touches[0].pageY, e);
};
Input.prototype.touchEnd = function(e) {
    e.preventDefault();
    this.touchPosition = null;
    //this.onTouchEnd_cb();
    if( e.touches.length>0)
        this.onMouseUp_cb(e.touches[0].pageX, e.touches[0].pageY, e);
    else
        this.onMouseUp_cb(0, 0, e);
};
Input.prototype.blur = function(e) {
    this.onBlur_cb();
};
Input.prototype.contextmenu = function(e) {
    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    }
    else if (e.clientX || e.clientY) {
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    this.onContextMenu_cb(posx, posy, e);

    e.preventDefault();
};

Loader = function (list) {
    this.list = list;
    this.loaded = false;
    this.load = function (callback) {
        console.log('@ loader.start. ',this.list);
        var imageCount = this.list.length;
        if (imageCount === 0) {
            this.loaded = true;
            callback();
            return
        }
        var that = this;
        var currentIndex = 0;
        var onload = function () {
            currentIndex++;
            console.log('@ loader.progress: %s/%s', currentIndex, imageCount);
            if (currentIndex == imageCount) {
                that.loaded = true;
                console.log('@ loader.done.');
                callback();
            }
        };
        var onerror = function(e){
            console.log('@ loader.error');
            onload();
        };
        for (var i= 0;i<this.list.length;i++) {
            var image = new Image();
            image.onload = onload;
            image.onerror = onerror;
            image.src = this.list[i].src;
            this.list[i].data = image;
        }
    };
};

var defaultInterval = 33;
window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, defaultInterval);
        };
})();


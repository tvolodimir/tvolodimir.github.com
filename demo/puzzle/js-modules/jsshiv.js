defineModule('jsshiv', [], function (module) {
    /**
     *  @overview jsShiv
     **/

    "use strict";

    var global =  ('undefined' === typeof window) ? GLOBAL : window;

    (function (global) {
        var global_isFinite = global.isFinite;

        Object.defineProperty(Number, 'isFinite', {
            value: function isFinite(value) {
                return typeof value === 'number' && global_isFinite(value);
            },
            configurable: true,
            enumerable: false,
            writable: true
        });
    })(global);

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elem) {
            for (var i = 0, length = this.length; i < length; ++i) {
                if (this[i] === elem) {
                    return i;
                }
            }
            return -1;
        };
    }

    if (!Function.prototype.bind) {
        Function.prototype.bind = function (obj) {
            var fn = this;
            return function () {
                return fn.apply(obj, arguments);
            };
        };
    }

    if (!Date.now) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }

    if ('undefined' !== typeof HTMLElement) {
        if (!HTMLElement.prototype.insertAdjacentElement) {
            HTMLElement.prototype.insertAdjacentElement = function (where, parsedNode) {
                switch (where) {
                    case 'beforeBegin':
                        this.parentNode.insertBefore(parsedNode, this);
                        break;
                    case 'afterBegin':
                        this.insertBefore(parsedNode, this.firstChild);
                        break;
                    case 'beforeEnd':
                        this.appendChild(parsedNode);
                        break;
                    case 'afterEnd':
                        if (this.nextSibling)
                            this.parentNode.insertBefore(parsedNode, this.nextSibling);
                        else this.parentNode.appendChild(parsedNode);
                        break;
                }
            };
            HTMLElement.prototype.insertAdjacentHTML = function (where, htmlStr) {
                var r = this.ownerDocument.createRange();
                r.setStartBefore(this);
                var parsedHTML = r.createContextualFragment(htmlStr);
                this.insertAdjacentElement(where, parsedHTML);
            };
            HTMLElement.prototype.insertAdjacentText = function (where, txtStr) {
                var parsedText = document.createTextNode(txtStr);
                this.insertAdjacentElement(where, parsedText);
            };
        }
    }

    if (!Object.prototype.watch) {
        (function () {
            // object.watch
            if (!Object.prototype.watch) {
                Object.defineProperty(Object.prototype, "watch", {
                    enumerable: false, configurable: true, writable: false,
                    value: function (prop, handler) {
                        var oldval = this[prop],
                            newval = oldval,
                            getter = function () {
                                return newval;
                            },
                            setter = function (val) {
                                oldval = newval;
                                return newval = handler.call(this, prop, oldval, val);
                            };

                        if (delete this[prop]) { // can't watch constants
                            Object.defineProperty(this, prop, { get: getter, set: setter, enumerable: true, configurable: true });
                        }
                    }
                });
            }

            // object.unwatch
            if (!Object.prototype.unwatch) {
                Object.defineProperty(Object.prototype, "unwatch", {
                    enumerable: false, configurable: true, writable: false,
                    value: function (prop) {
                        var val = this[prop];
                        delete this[prop]; // remove accessors
                        this[prop] = val;
                    }
                });
            }
        })();
    }
});
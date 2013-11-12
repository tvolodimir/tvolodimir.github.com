defineModule('jsextend', [], function (module) {

    /**
     *  @overview jsExtend
     **/

    /*jshint unused:false */
    /*global exports:true */

    //var scope = (typeof exports === 'object') ? exports : window;
    //var scope =  ('undefined' === typeof window) ? GLOBAL : window;

    "use strict";

    /**
     * fix default prototype's constructor
     * @param {Function} constructor
     */
    var fixConstructor = function(constructor) {
        "use strict";

        if ('function' != typeof constructor) {
            throw new TypeError(constructor + ' is not function');
        }
        if (constructor.prototype.constructor == Object.prototype.constructor) {
            constructor.prototype.constructor = constructor;
        }
    };

    /**
     * modify child's prototype object by inherits from paret's prototype
     * @param {Function} child
     * @param {Function} parent
     */
    var inherit = function(child, parent) {
        "use strict";

        fixConstructor(child);
        fixConstructor(parent);
        var a = Object.create(parent.prototype);
        for (var prop in child.prototype)
            if (child.prototype.hasOwnProperty(prop))
                a[prop] = child.prototype[prop];
        child.prototype = a;

        // reference to parent
        // to call parent constructor:
        // child.prototype.base.constructor.call(this, args);
        child.prototype.base = parent.prototype;
    };

    /*
    var Parent = function (prop) {
        console.log('parent ctor with ', prop);
        this.prop = prop;
    };
    Parent.prototype = {
        SharedMethod: function () {
            console.log('this is parent shared method ', this.prop);
        }
    };

    var Child = function (prop) {
        console.log('child ctor with ', prop + 1000);
        this.prop = prop;
        Child.prototype.base.constructor.call(this, prop);
    };
    Child.prototype = {
        SharedMethod: function () {
            Child.prototype.base.SharedMethod.call(this);
            console.log('this is parent shared method ', this.prop);
        }
    };

    inherit(Child, Parent);
    var c = new Child(99);
    c.SharedMethod();
    */

    var extend = function(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
        return target;
    };

    String.prototype.replaceSubstr = function (index, howManyToDelete, stringToInsert) {
        if (stringToInsert === undefined) stringToInsert = '';
        if (howManyToDelete === undefined || howManyToDelete < 0) howManyToDelete = 0;
        return this.substr(0, index) + stringToInsert + this.substr(index + howManyToDelete);
    };

    var arrayToString = function (array) {
        var l = '';
        for (var i = 0; i < array.length; i++) {
            l += array[i] + ((i < (array.length - 1)) ? ', ' : '');
        }
        return '[' + l + ']';
    };
    var matrixToString = function (matrix) {
        var l = '';
        for (var row = 0; row < matrix.length; row++) {
            l += '[ ';
            for (var col = 0; col < matrix[0].length; col++) {
                l += matrix[row][col] + ((col < (matrix[0].length - 1)) ? ', ' : '');
            }
            l += ']\n\r';
        }
        return '[' + l + ']';
    };

    /**
     * @return {string}
     */
    var s4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    var generateGuid = function () {
        return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
    };

    module.inherit = inherit;
    module.extend = extend;
    module.arrayToString = arrayToString;
    module.matrixToString = matrixToString;
    module.generateGuid = generateGuid;
}, module.exports);
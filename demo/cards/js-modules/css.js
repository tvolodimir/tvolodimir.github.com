defineModule('css', [], function (module) {

    /**
     * @overview Css module.
     */

    var convertNumber = function (value) {
        var v = Number(value);
        if (!Number.isFinite(v)) {
            console.error('incorect parameters', value);
            return 0;
        }
        if ((v > 1e10) || (v < -1e10)) {
            console.error('incorect parameters', value);
            return 0;
        }
        if ((v < 1e-5) && (v > -1e-5)) {
            return 0;
        }
        v = Math.round(v * 100000) / 100000;
        return v;
    };

    var needprefix = [
        'transform-style',
        'transform-origin',
        'transform',
        'perspective',
        'perspective-origin',
        'animation',
        'animation-name',
        'animation-duration',
        'animation-play-state',
        'animation-fill-mode'
    ];

    var cssPropertiesNameMap = {};

    var transformOnlyCssSet = ';transform:';

    var Enables = {
        supportsTransitions: false,
        supportsAnimations: false,
        supports3d: false,
        prefix: '',
        defPrefix: '',
        detect: function () {
            var e = this;
            e.supportsTransitions = false;
            e.prefix = '';
            e.defPrefix = '';

            //anim
            e.supportsAnimations = false;
            e.animPrefix = '';
            e.animString = 'Animation';
            e.keyframePrefix = '';

            var div = document.createElement('div');

            var prefs = 'Webkit Moz O ms Khtml'.split(' ');

            if (div.style.animationName) {
                e.supportsAnimations = true;
            }
            if (e.supportsAnimations === false) {
                for (var i = 0; i < prefs.length; i++) {
                    if (div.style[ prefs[i] + 'Animation' ] !== undefined) {
                        e.animPrefix = prefs[ i ];
                        e.animString = e.animPrefix + 'Animation';
                        e.keyframePrefix = '-' + e.animPrefix.toLowerCase() + '-';
                        e.supportsAnimations = true;
                        break;
                    }
                }
            }

            //transform
            e.supportsTransformations = false;
            e.transformationPrefix = '';
            e.transformationCssPrefix = '';
            e.transformationString = 'Transform';

            if (div.style.transform) {
                e.supportsTransformations = true;
            }
            if (e.supportsTransformations === false) {
                for (var i = 0; i < prefs.length; i++) {
                    if (div.style[ prefs[i] + 'Transform' ] !== undefined) {
                        e.transformationPrefix = prefs[ i ];
                        e.transformationString = e.transformationPrefix + 'Transform';
                        e.transformationCssPrefix = '-' + e.transformationPrefix.toLowerCase() + '-';
                        e.supportsTransformations = true;
                        break;
                    }
                }
            }

            //transition
            e.supportsTransitions = false;
            e.transitionPrefix = '';
            e.transitionCssPrefix = '';
            e.transitionString = 'Transition'

            if (div.style.transition) {
                e.supportsTransitions = true;
            }
            if (e.supportsTransitions === false) {
                for (var i = 0; i < prefs.length; i++) {
                    if (div.style[ prefs[i] + 'Transition' ] !== undefined) {
                        e.transitionPrefix = prefs[ i ];
                        e.transitionString = e.transitionPrefix + 'Transition';
                        e.transitionCssPrefix = '-' + e.transitionPrefix.toLowerCase() + '-';
                        e.supportsTransitions = true;
                        break;
                    }
                }
            }

            e.supports3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix() && 'webkitPerspective' in div.style;

            this._buildMap();
        },
        _buildMap: function () {
            for (var i = 0; i < needprefix.length; i++) {
                cssPropertiesNameMap[needprefix[i]] = (Enables.transformationCssPrefix + needprefix[i]);
            }
            transformOnlyCssSet = ';' + Enables.transformationCssPrefix + 'transform:';
        }
    };

    var CSSTransform = {
        translateX: function (x) {
            x = convertNumber(x);
            return ' translateX(' + x + 'px) ';
        },
        translateY: function (y) {
            y = convertNumber(y);
            return ' translateY(' + y + 'px) ';
        },
        translateZ: function (z) {
            z = convertNumber(z);
            return ' translateZ(' + z + 'px) ';
        },
        translate3d: function (x, y, z) {
            x = convertNumber(x);
            y = convertNumber(y);
            z = convertNumber(z);
            return ' translate3d(' + x + 'px,' + y + 'px,' + z + 'px) ';
        },
        translate: function (x, y) {
            x = convertNumber(x);
            y = convertNumber(y);
            return ' translate(' + x + 'px,' + y + 'px) ';
        },
        rotateX: function (deg) {
            deg = convertNumber(deg);
            return ' rotateX(' + deg + 'deg) ';
        },
        rotateY: function (deg) {
            deg = convertNumber(deg);
            return ' rotateY(' + deg + 'deg) ';
        },
        rotateZ: function (deg) {
            deg = convertNumber(deg);
            return ' rotateZ(' + deg + 'deg) ';
        },
        rotate: function (deg) {
            deg = convertNumber(deg);
            return ' rotate(' + deg + 'deg) ';
        },
        rotate3d: function (x, y, z, deg) {
            x = convertNumber(x);
            y = convertNumber(y);
            z = convertNumber(z);
            deg = convertNumber(deg);
            return ' rotate3d(' + x + ',' + y + ',' + 'z' + ',' + deg + 'deg) ';
        },
        scale: function (x, y) {
            x = convertNumber(x);
            y = convertNumber(y);
            return ' scale(' + x + ',' + y + ') ';
        },
        /**
         * eulerAngles in grad -> csstransform
         * @param {Number} psi grad  z
         * @param {Number} theta grad y
         * @param {Number} phi grad  x
         * @return {String} csstransform string
         */
        eulerMatrix: function (psi, theta, phi) {
            return CSSTransform.rotateY(psi) + CSSTransform.rotateX(theta) + CSSTransform.rotateZ(phi);
        }
    };

    /**
     * set Css
     * @param {HTMLElement} elem
     * @param props
     * @returns {string}
     */
    var setCss = function (elem, props) {
        var css = '';
        for (var key in props) {
            var v = cssPropertiesNameMap[key];
            css += ((v !== undefined) ? v : key) + ':' + props[key] + ';';
            //css += ((needprefix.indexOf(key) > -1) ? (Enables.transformationCssPrefix + key) : key) + ':' + props[key] + ';';
        }
        return elem.style.cssText += ';' + css;
    };

    /**
     * set Css Transform
     * @param {HTMLElement} elem
     * @param value
     */
    var setCssTransform = function (elem, value) {
        elem.style.cssText += (transformOnlyCssSet + value);
    };

    /**
     * getStyle
     * @param {HTMLElement} element
     * @returns {CSSStyleDeclaration}
     */
    var getStyle = function (element) {
        return window.getComputedStyle(element, null);
    };

    function init() {
        if (document.readyState === 'complete' || document.readyState == 'loaded' || document.readyState == 'interactive') {
            Enables.detect();
        }
        else {
            document.addEventListener('DOMContentLoaded', init, false);
        }
    }

    init();

    //module.convertNumber = convertNumber;
    //module.Enables = Enables;
    //module.getStyle = getStyle;
    module.CSSTransform = CSSTransform;
    module.setCss = setCss;
    module.setcss = setCss;
    module.setCssTransform = setCssTransform;

});
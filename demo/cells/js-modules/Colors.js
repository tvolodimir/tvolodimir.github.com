defineModule('Colors', [], function (module) {
    /**
     * @overview Color module.
     */

    "use strict";

    var trim = function (v, min, max) {
        if (typeof v !== "number") {
            throw new Error('unexpeceted type: '+ typeof v);
        }
        if (v < min) return min;
        if (v > max) return max;
        return v;
    };

    /**
     * RGBA Color
     * @param {Number[]} rgb triple of 0.255
     * @param {Number} a opacity 0.1
     * @constructor
     * @class Color
     */
    var Color = function Color(rgb, a) {
        try {
            if (!rgb) {
                this.rgb = [0, 0, 0];
            }
            else {
                this.rgb = [];
                this.rgb[0] = trim(rgb[0], 0, 255) | 0;
                this.rgb[1] = trim(rgb[1], 0, 255) | 0;
                this.rgb[2] = trim(rgb[2], 0, 255) | 0;
            }
            this.a = (a !== undefined) ? trim(Number(a), 0, 1) : 1;
        }
        catch (e) {
            throw new Error(e + " rgb = " + rgb + ", a = " + a);
        }
    };
    Color.fromString = function (str) {
        var v;
        var rgb = [0, 0, 0];
        var a = 1;
        if (str.length == 3 || str.length == 4 || str.length == 6 || str.length == 7) {
            // FFF #FFF FFFFFF #FFFFFF
            str = (str.charAt(0) == "#") ? str.substring(1) : str;   // FFF FFFFFF
            if (str.length == 6) {
                rgb[0] = parseInt(str.substring(0, 2), 16);
                rgb[1] = parseInt(str.substring(2, 4), 16);
                rgb[2] = parseInt(str.substring(4, 6), 16);
            }
            else {
                rgb[0] = parseInt(str.substring(0, 1), 16);
                rgb[1] = parseInt(str.substring(1, 2), 16);
                rgb[2] = parseInt(str.substring(2, 3), 16);
            }
        }
        else if (str.indexOf('rgba(') == 0 && (str.charAt(str.length - 1) == ")")) {
            // rgba(*,*,*,*) - rgba(***,***,***,*********)     10+3 10+10+..
            str = str.substring(5, str.length - 1);
            v = str.split(',');
            if (v.length != 4) throw new Error('unexpected argument format: ' + str);
            rgb[0] = parseInt(v[0], 10);
            rgb[1] = parseInt(v[1], 10);
            rgb[2] = parseInt(v[2], 10);
            a = Number(v[3]);
        }
        else if (str.indexOf('rgb(') == 0 && (str.charAt(str.length - 1) == ")")) {
            // rgb(*,*,*) - rgb(***,***,***)     7+3 7+9
            str = str.substring(4, str.length - 1);
            v = str.split(',');
            if (v.length != 3) throw new Error('unexpected argument format: ' + str);
            rgb[0] = parseInt(v[0], 10);
            rgb[1] = parseInt(v[1], 10);
            rgb[2] = parseInt(v[2], 10);
        }
        else {
            throw new Error('unexpected argument format: ' + str);
        }
        if (!isFinite(rgb[0]) || !isFinite(rgb[1]) || !isFinite(rgb[2]) || !isFinite(a)) {
            throw new Error('unexpected argument format: ' + str);
        }
        return new Color(rgb, a);
    };
    Color.prototype = {
        constructor:Color,

        toRGB:function () {
            return  'rgb(' + this.rgb[0] + ',' + this.rgb[1] + ',' + this.rgb[2] + ')';
        },
        toRGBA:function (a) {
            if (a == undefined) a = this.a;
            return  'rgba(' + this.rgb[0] + ',' + this.rgb[1] + ',' + this.rgb[2] + ',' + a + ')';
        },
        toHEX:function () {
            return '#' +
                ((this.rgb[0] < 16) ? '0' : '') + this.rgb[0].toString(16) +
                ((this.rgb[1] < 16) ? '0' : '') + this.rgb[1].toString(16) +
                ((this.rgb[2] < 16) ? '0' : '') + this.rgb[2].toString(16);
        },
        hsv:function (cb) {
            this.rgb = ColorHelper.HSVtoRGB(cb(ColorHelper.RGBtoHSV(this.rgb)));
            return this;
        },
        hsv_factors:function (hsv_k) {
            var hsv = ColorHelper.RGBtoHSV(this.rgb);
            hsv[0] *= hsv_k[0];
            hsv[1] *= hsv_k[1];
            hsv[2] *= hsv_k[2];
            return new Color(ColorHelper.HSVtoRGB(hsv), this.a);
        },
        hsv_lerp:function (hsvTo, alpha) {
            var hsv = ColorHelper.RGBtoHSV(this.rgb);
            var hsva = [];
            hsva[0] = hsv[0] + alpha * (hsvTo[0] - hsv[0]);
            hsva[1] = hsv[1] + alpha * (hsvTo[1] - hsv[1]);
            hsva[2] = hsv[2] + alpha * (hsvTo[2] - hsv[2]);
            return new Color(ColorHelper.HSVtoRGB(hsva), this.a);
        }
    };

    /**
     * http://colorschemedesigner.com/
     * http://www.colorcombos.com/
     * http://getcolor.ru
     * http://0to255.com
     */
    var ColorHelper = {
        getRandomRGB:function () {
            var r = Math.floor(Math.random() * 256);
            var g = Math.floor(Math.random() * 256);
            var b = Math.floor(Math.random() * 256);
            return [r, b, g];
        },
        RGBtoString:function (RGB, scalar) {
            if (scalar === undefined) scalar = 1;
            return  'rgb(' + scalar * RGB[0] + ',' + scalar * RGB[1] + ',' + scalar * RGB[2] + ')';
        },
        rgbCache:{},
        HexToRGB:function (h, a) {
            h = (h.charAt(0) == "#") ? h.substring(1, 7) : h;
            if (this.rgbCache[h] == null) {
                this.rgbCache[h] = parseInt(h.substring(0, 2), 16) + ","
                    + parseInt(h.substring(2, 4), 16) + ","
                    + parseInt(h.substring(4, 6), 16);
            }
            return (a ? "rgba(" : "rgb(") + this.rgbCache[h] + (a ? "," + a + ")" : ")");
        },
        RGBToHex:function (r, g, b) {
            return r.toString(16) + g.toString(16) + b.toString(16);
        },
        RGBtoHSV:function (RGB) {
            var HSV = [0, 0, 0];

            var r = RGB[0] / 255;
            var g = RGB[1] / 255;
            var b = RGB[2] / 255;

            var minVal = Math.min(r, g, b);
            var maxVal = Math.max(r, g, b);
            var delta = maxVal - minVal;

            HSV[2] = maxVal;

            if (delta == 0) {
                HSV[0] = 0;
                HSV[1] = 0;
            } else {
                HSV[1] = delta / maxVal;

                if (r == maxVal) {
                    HSV[0] = ((g - b) / delta) / 6;
                    if (HSV[0] < 0)HSV[0] = HSV[0] + 1;
                }
                else if (g == maxVal) {
                    HSV[0] = (1 / 3) + ((b - r) / delta) / 6;
                }
                else if (b == maxVal) {
                    HSV[0] = (2 / 3) + ((r - g) / delta) / 6;
                }

                if (HSV[0] < 0) {
                    HSV[0] += 1;
                }
                if (HSV[0] > 1) {
                    HSV[0] -= 1;
                }
            }

            HSV[0] = Math.round(HSV[0] * 360);
            HSV[1] = Math.round(HSV[1] * 100);
            HSV[2] = Math.round(HSV[2] * 100);

            return HSV;
        },
        HSVtoRGB:function (HSV) {
            var RGB = [0, 0, 0];

            var h = HSV[0] / 360;
            var s = HSV[1] / 100;
            var v = HSV[2] / 100;

            if (s == 0) {
                RGB[0] = Math.round(v * 255);
                RGB[1] = Math.round(v * 255);
                RGB[2] = Math.round(v * 255);
            }
            else {
                var i = Math.floor(HSV[0] / 60); if (i==6)i=0;
                var f = (HSV[0] / 60) - i;
                var p = v * (1 - s);
                var q = v * (1 - s * f);
                var t = v * (1 - s * (1 - f));
                var r, g, b;
                if (i == 0) {
                    r = v;
                    g = t;
                    b = p;
                }
                else if (i == 1) {
                    r = q;
                    g = v;
                    b = p;
                }
                else if (i == 2) {
                    r = p;
                    g = v;
                    b = t;
                }
                else if (i == 3) {
                    r = p;
                    g = q;
                    b = v;
                }
                else if (i == 4) {
                    r = t;
                    g = p;
                    b = v;
                }
                else if (i == 5) {
                    r = v;
                    g = p;
                    b = q;
                }
                else {
                    throw new Error(HSV);
                }

                RGB[0] = Math.round(r * 255);
                RGB[1] = Math.round(g * 255);
                RGB[2] = Math.round(b * 255);
            }

            return RGB;
        },
        CMYKtoRGB:function (CMYK) {
            var RGB = [0, 0, 0];

            var c = CMYK[0] / 100;
            var m = CMYK[1] / 100;
            var y = CMYK[2] / 100;
            var k = CMYK[3] / 100;

            RGB[0] = 1 - Math.min(1, c * ( 1 - k ) + k);
            RGB[1] = 1 - Math.min(1, m * ( 1 - k ) + k);
            RGB[2] = 1 - Math.min(1, y * ( 1 - k ) + k);

            RGB[0] = Math.round(RGB[0] * 255);
            RGB[1] = Math.round(RGB[1] * 255);
            RGB[2] = Math.round(RGB[2] * 255);

            return RGB;
        },
        RGBtoCMYK:function (RGB) {
            var CMYK = [0, 0, 0, 0];

            var r = RGB[0] / 255;
            var g = RGB[1] / 255;
            var b = RGB[2] / 255;

            CMYK[3] = Math.min(1 - r, 1 - g, 1 - b);
            CMYK[0] = ( 1 - r - CMYK[3] ) / ( 1 - CMYK[3] );
            CMYK[1] = ( 1 - g - CMYK[3] ) / ( 1 - CMYK[3] );
            CMYK[2] = ( 1 - b - CMYK[3] ) / ( 1 - CMYK[3] );

            CMYK[0] = Math.round(CMYK[0] * 100);
            CMYK[1] = Math.round(CMYK[1] * 100);
            CMYK[2] = Math.round(CMYK[2] * 100);
            CMYK[3] = Math.round(CMYK[3] * 100);

            return CMYK;
        },
        fromHSV:function (h, s, v) {
            if (h <= 0) {
                h = 0;
            }
            if (s <= 0) {
                s = 0;
            }
            if (v <= 0) {
                v = 0;
            }

            if (h > 360) {
                h = 360;
            }
            if (s > 100) {
                s = 100;
            }
            if (v > 100) {
                v = 100;
            }

            return [h, s, v];
        },
        fromRGB:function (r, g, b) {
            if (r <= 0) {
                r = 0;
            }
            if (g <= 0) {
                g = 0;
            }
            if (b <= 0) {
                b = 0;
            }

            if (r > 255) {
                r = 255;
            }
            if (g > 255) {
                g = 255;
            }
            if (b > 255) {
                b = 255;
            }

            return [r, g, b];
        },
        fromCMYK:function (c, m, y, k) {
            if (c <= 0) {
                c = 0;
            }
            if (m <= 0) {
                m = 0;
            }
            if (y <= 0) {
                y = 0;
            }
            if (k <= 0) {
                k = 0;
            }

            if (c > 100) {
                c = 100;
            }
            if (m > 100) {
                m = 100;
            }
            if (y > 100) {
                y = 100;
            }
            if (k > 100) {
                k = 100;
            }

            return [c, m, y, k];
        }
    };

    module.Color = Color;
    module.ColorHelper = ColorHelper;
}, module.exports);


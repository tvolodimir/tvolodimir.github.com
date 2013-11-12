defineModule('DataTimeBuffer', [], function (module) {

    /**
     *  @overview DataTimeBuffer
     **/

    'use strict';

    function friendlyNumber(value, fractionalDigits) {
        if ((value - (value | 0)) == 0) {
            return value | 0;
        }
        return value.toFixed(fractionalDigits);
    }

    /**
     * Data Time Buffer
     * @param {Array} agregationsInterval recomended [100,1000]
     * @param {Number} timeBufferLength recomended 1000
     * @param {String} name String
     */
    var DataTimeBuffer = function (agregationsInterval, timeBufferLength, name, x_aggregation) {
        this.name = name;
        this.agregations = [];
        this.statratio = [];
        this.offset = (x_aggregation == undefined ? Date.now() : x_aggregation);
        for (var i = 0; i < agregationsInterval.length; i++) {
            this.agregations.push({interval: agregationsInterval[i], length: timeBufferLength, endX: 0, data: [], cursor: 0, undefinedAsZero: true});
            this.statratio[i] = [1];
        }
        this.padding_top = 3;
        this.padding_left = 3;
        this.height_item = 16;
        this.floorheight = 3;
        this.paddingStat = 2;
        this.headheight = 9;
        this.onskeepedaggregatedindexsetlast = false;
        this.calc_averg = false;
        this.width = this.agregations[0].length + 45 + 3;
        this.height = this.agregations.length * 31 + 5;
    };
    DataTimeBuffer.prototype = {
        constructor: DataTimeBuffer,
        /**
         * push value in timeline
         * @param {Number} value
         */
        push: function (value, x_aggregation) {
            var now = (x_aggregation == undefined ? Date.now() : x_aggregation) - this.offset,
                a, x, i;
            for (i = 0; i < this.agregations.length; i++) {
                a = this.agregations[i];
                x = (now / a.interval) | 0; // "x|0" = trunc(x)
                var lastvalue = a.data[a.cursor];
                var count = x - a.endX;
                if (this.onskeepedaggregatedindexsetlast) {
                    //console.log(count);
                }
                if (count > 0) {
                    if (count > 1) {
                        for (var j = 0; j < count - 1; j++) {
                            a.cursor++;
                            if (a.cursor == a.length) a.cursor = 0;
                            if (this.onskeepedaggregatedindexsetlast) {
                                a.data[a.cursor] = lastvalue;
                                //console.log(lastvalue);
                            }
                            else {
                                a.data[a.cursor] = undefined;
                            }
                        }
                    }
                    a.cursor++;
                    if (a.cursor == a.length) a.cursor = 0;
                    a.data[a.cursor] = value;
                    a.endX = x;
                }
                else if (count == 0) {
                    if (a.data[a.cursor] == undefined) {
                        a.data[a.cursor] = value;
                    }
                    else {
                        if (this.calc_averg) {
                            a.data[a.cursor] = .5 * (a.data[a.cursor] + value);
                        }
                        else {
                            a.data[a.cursor] += value;
                        }

                    }
                }
                else {
                    if (count > -(a.length - 1)) {
                        var index = a.cursor - count;
                        if (index < 0) index += (a.length - 1);
                        if (a.data[index] == undefined) {
                            a.data[index] = value;
                        }
                        else {
                            if (this.calc_averg) {
                                a.data[a.cursor] = .5 * (a.data[a.cursor] + value);
                            }
                            else {
                                a.data[a.cursor] += value;
                            }
                        }

                    }
                }
            }
        },
        /**
         * update timeline to nowtime
         */
        update: function (x_aggregation) {
            var now = (x_aggregation == undefined ? Date.now() : x_aggregation) - this.offset,
                a, x, i;
            for (i = 0; i < this.agregations.length; i++) {
                a = this.agregations[i];
                x = (now / a.interval) | 0;
                var lastvalue = a.data[a.cursor];
                var count = x - a.endX;
                if (count > 1) {
                    for (var j = 0; j < count - 1; j++) {
                        a.cursor++;
                        if (a.cursor == a.length) a.cursor = 0;
                        if (this.onskeepedaggregatedindexsetlast) {

                            a.data[a.cursor] = lastvalue;
                            //console.log(lastvalue);
                        }
                        else {
                            a.data[a.cursor] = undefined;
                        }
                    }
                    a.endX = x - 1;
                }
                this.updateStats(a);
            }
        },
        setCountBuffer: function (buffer) {
            this.countBuffer = buffer;
        },
        updateStats: function (timeline) {
            "use strict";

            // finding min, max and avg values
            var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, avg = 0, j, items = 0, v;
            for (j = 0; j < timeline.length; j++) {
                v = timeline.data[j];
                if (v !== undefined && timeline.cursor != j) {

                    // normalize by another stats
                    if (this.countBuffer !== undefined) v /= this.countBuffer.agregations[i].data[j];

                    min = Math.min(v, min);
                    max = Math.max(v, max);
                    avg = avg + v;
                    items++;
                }
            }
            if (items == 0) {
                max = 0;
                min = 0;
            }
            else avg /= (timeline.undefinedAsZero ? timeline.data.length : items);
            if (max == min) avg = min;

            timeline.global_min = timeline.min = min;
            timeline.global_max = timeline.max = max;
            timeline.avg = avg;
        },
        draw: function (ctx) {
            ctx.save();
            ctx.textAlign = "start";

            ctx.fillStyle = 'rgba(0,0,0,.6)';
            ctx.fillRect(0, 0, this.width, this.height);

            ctx.font = '11px Courier';
            ctx.strokeStyle = '#FFF';
            ctx.fillStyle = '#FFF';

            ctx.translate(this.padding_left, this.headheight);

            ctx.fillStyle = '#BBB';
            ctx.fillText(this.name, 0, 0);

            for (var i = 0; i < this.agregations.length; i++) {

                this.updateStats(i);
                var a = this.agregations[i]; // timeline

                ctx.fillStyle = '#888';
                ctx.fillText(friendlyNumber(a.max * this.statratio[i], 1), a.length + this.paddingStat, 0);

                ctx.fillStyle = '#FFF';
                ctx.fillText(friendlyNumber(a.avg * this.statratio[i], 1), a.length + this.paddingStat, 11);

                ctx.fillStyle = '#888';
                ctx.fillText(friendlyNumber(a.min * this.statratio[i], 1), a.length + this.paddingStat, 22);

                ctx.strokeStyle = '#FFF';
                ctx.beginPath();

                var newfloorheight = ((a.global_min > 2 || a.global_min < -2) ? 3 : a.global_min) | 0;
                this.height_item = this.height_item + this.floorheight - newfloorheight;
                this.floorheight = newfloorheight;

                var index = a.cursor - 1, j, v;
                for (j = 0; j < a.length; j++) {
                    index++;
                    if (index >= a.length) index = 0; // fix circle index
                    if (a.data[index] !== undefined && a.cursor != index) {

                        v = a.data[index];

                        // normalize by another stats
                        if (this.countBuffer !== undefined) v /= this.countBuffer.agregations[i].data[index];

                        v = (v - a.global_min) / (a.global_max - a.global_min);

                        if (a.global_max == a.global_min) v = 1;

                        var x = 0;
                        if (index < a.cursor) {
                            x = a.length - (a.cursor - index);
                        }
                        else {
                            x = index - a.cursor;
                        }

                        var t1 = (this.height_item * (1 - v)) | 0;
                        var t2 = this.height_item + this.floorheight;
                        if (t1 == t2 && v > 0) t1 -= 1;

                        ctx.moveTo(x + .5, this.padding_top + t1 + .5);
                        ctx.lineTo(x + .5, this.padding_top + t2 + .5);
                    }
                }
                ctx.closePath();
                ctx.stroke();
                ctx.strokeStyle = '#F00';
                ctx.beginPath();
                ctx.moveTo(a.length + .5, this.padding_top);
                ctx.lineTo(a.length + .5, this.padding_top + this.height_item + this.floorheight);
                ctx.closePath();
                ctx.stroke();
                ctx.translate(0, this.headheight + this.padding_top + this.height_item + this.floorheight);
            }

            ctx.restore();
        }
    };
    DataTimeBuffer.syncStats = function (timelines) {
        "use strict";
        var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, j, t;
        for (j = 0; j < timelines.length; j++) {
            t = timelines[j];
            min = Math.min(t.min, min);
            max = Math.max(t.max, max);
        }
        for (j = 0; j < timelines.length; j++) {
            t = timelines[j];
            t.global_min = min;
            t.global_max = max;
        }
    };

    module.DataTimeBuffer = DataTimeBuffer;
    module.friendlyNumber = friendlyNumber;
});
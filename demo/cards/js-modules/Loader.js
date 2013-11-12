defineModule('Loader', [], function (module) {
    /**
     *  @overview Loader
     **/

    'use strict';

    var Loader = function (list, root) {
        this.list = list;
        this.loaded = false;
        this.root = (root === undefined) ? '' : root;
    };
    Loader.prototype.load = function (callback, callback_progress) {

        console.log('@ loader.start. ', this.list);

        var imageCount = this.list.length;

        if (imageCount === 0) {
            this.loaded = true;
            callback();
            return;
        }

        var that = this;
        var currentIndex = 0;
        var onload = function () {
            currentIndex++;
            console.log('@ loader.progress: %s/%s', currentIndex, imageCount);
            if (callback_progress) {
                callback_progress(currentIndex, imageCount);
            }
            if (currentIndex == imageCount) {
                that.loaded = true;
                console.log('@ loader.done.');
                callback();
            }
        };
        var onerror = function (e) {
            console.log('@ loader.error');
            onload();
        };
        for (var i = 0; i < this.list.length; i++) {
            var image = new Image();
            image.onload = onload;
            image.onerror = onerror;
            image.src = this.root + this.list[i].src;
            this.list[i].data = image;
        }
    };

    module.Loader = Loader;

});
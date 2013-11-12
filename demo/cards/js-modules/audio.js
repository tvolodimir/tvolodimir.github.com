defineModule('audio', [], function (module) {
    /**
     * @overview Audio module.
     * @author tvolodimir@gmail.com
     */

    'use strict';

    var Media = {
        isEnabled: true,
        /**
         * audioSources
         * @type {AudioSource[]}
         */
        audioSources: [],
        /**
         * create AudioSource
         * @param {String} soundURL
         * @param {Number[][]} soundIntervals
         * @return {AudioSource}
         */
        create: function (soundURL, soundIntervals) {
            var as = new AudioSource(soundURL, soundIntervals);
            Media.audioSources.push(as);
            return as;
        },
        /**
         * stop all audio sources
         */
        pauseSounds: function () {
            for (var i = 0; i < Media.audioSources.length; i++) {
                Media.audioSources[i].pauseSound();
            }
        },
        isEnable: function () {
            if (this.audioTypes.length === 0) {
                return false;
            }

            return true;
        },
        audioTypes: [],
        _init: function () {
            var tt = ['audio/mpeg', 'audio/mp4'];
            var res = this.audioTypes, t, a = document.createElement('audio');
            if (a.canPlayType === undefined) {
                return;
            }
            t = a.canPlayType('audio/ogg');
            if (t === 'probably' || t === 'maybe') {
                res.push('ogg');
            }
            t = a.canPlayType('audio/wav');
            if (t === 'probably' || t === 'maybe') {
                res.push('wav');
            }
            t = a.canPlayType('audio/mp3');
            if (t === 'probably' || t === 'maybe') {
                res.push('mp3');
            }
        }
    };

    /**
     * AudioSource
     * @class AudioSource
     * @param {String} soundURL
     * @param {Number[][]} soundIntervals
     * @constructor
     */
    var AudioSource = function AudioSource(soundURL, soundIntervals) {
        this.soundURL = soundURL;
        this.soundIntervals = soundIntervals;

        //create sound object

        /**
         * @type {HTMLAudioElement}
         */
            //this.soundObject = document.createElement('audio');
        this.soundObject = new Audio(this.soundURL);
        var audio = this.soundObject;

        //audio.style.display = 'none';
        //audio.autobuffer = true;
        // audio.autoplay = false;
        // audio.preload = "auto";
        audio.src = soundURL;
        audio.setAttribute("src", this.soundURL);// + audioType);
        // audio.addEventListener("canplaythrough", itemLoaded, false);
        //audio.crossorigin = ;
        //audio.mediagroup
        //  audio.loop = false;
        //audio.muted = true;
        //   audio.controls = false;
        //audio.buffered
        //controller
        //currentTime
        //defaultMuted
        //defaultPlaybackRate
        //duration
        //ended
        //initialTime
        //networkState = 0
        //paused
        //playbackRate
        //played
        //readyState
        //seekable
        //seeking
        //startTime
        //textTracks
        //volume
        /*
         HAVE_CURRENT_DATA: 2
         HAVE_ENOUGH_DATA: 4
         HAVE_FUTURE_DATA: 3
         HAVE_METADATA: 1
         HAVE_NOTHING: 0
         NETWORK_EMPTY: 0
         NETWORK_IDLE: 1
         NETWORK_LOADING: 2
         NETWORK_NO_SOURCE: 3
         */
        //addTextTrack()
        //canPlayType()
        //load()
        //pause()
        //play()
        //webkitAddKey()
        //webkitCancelKeyRequest()
        //webkitGenerateKeyRequest()

        var that = this;

        /*if (typeof audio.loop == 'boolean')
         {
         audio.loop = true;
         }
         else */
        {
            audio.addEventListener('ended', function () {
                that._onEnded();
            }, false);
        }
        //audio.play();


        this.currentSound = 0;
        this.isLooped = false;
        this.ended = true;
        this.loaded = false;

        this.isEnabled = (audio.currentSrc !== undefined);

        //if (audio.networkState == 0) {

        /*   setTimeout(function () {
         audio.volume = 0;
         // audio.load();
         audio.play();
         //setTimeout(function(){audio.pause()},1000);

         }, 1000);   */
        //}

        audio.addEventListener("progress", function () {
            that._onProgress();
        }, false);
        // audio.addEventListener("canplaythrough", audioLoaded, false);


        if (this.isEnabled) {
            var g = this;
            //audio.addEventListener('timeupdate', handler, false);
            audio.addEventListener('loadeddata', function (e) {
                g._soundTimeChanged();
            }, false);
            audio.addEventListener('canplaythrough', function (e) {
                if (g.loaded) return;
                g.loaded = true;

                g.onLoaded();
            }, false);

            window.addEventListener('DOMContentLoaded', function (e) {
            }, false);
            window.addEventListener('unload', function (e) {
                //g.pauseSound();
                //g.soundObject.src = '';
            }, false);
            window.addEventListener('pageshow', function (e) {
                // Prevent black screen when going back from the previous page
                //document.body.className = document.body.className;
                //g.playSound();
            }, false);
            window.addEventListener('pagehide', function (e) {
                //g.pauseSound();
            }, false);
        }

        this.onLoaded = function () {
        };
    };
    AudioSource.prototype = {
        constructor: AudioSource,

        _onProgress: function () {
            var a = this.soundObject;
            //var percentLoaded = parseInt(((a.buffered.end(0) / a.duration) * 100));
            //console.log(this.soundURL, a.buffered.end(0), a.duration, a.buffered.start(0), percentLoaded);
        },
        _onEnded: function () {
            if (this.isLooped === true && this.soundIntervals.length === 1) {
                this.soundObject.volume = 1;
                this.soundObject.currentTime = 0;
                this.soundObject.play();
            }
        },

        pauseSound: function () {
            if (Media.isEnabled == false || this.isEnabled == false) {
                return;
            }

            if (!this.soundObject.paused) {
                this.soundObject.pause();
            }
        },
        _soundTimeChanged: function () {
            var interval = this.soundIntervals[this.currentSound];
            if (interval) {
                if (this.soundObject.currentTime > interval[1]) {
                    if (this.isLooped) {
                        this.soundObject.currentTime = interval[0];
                    }
                    else {
                        this.ended = true;
                        this.pauseSound();
                    }
                }
            }
            else {
                this.pauseSound();
            }
        },

        mute: function () {
            this.soundObject.volume = 0;
        },

        unmute: function () {
            this.soundObject.volume = 1;
        },

        playSound: function (index, isLooped) {
            if (Media.isEnabled == false || this.isEnabled == false) {
                return;
            }

            if (this.soundObject.networkState == this.soundObject.NETWORK_NO_SOURCE) {
                return;
            }

            if (!this.loaded) {
                return;
            }

            if (index === undefined && isLooped === undefined && this.ended === false && this.currentSound > -1 && this.soundObject.paused) {
                // unpause
                this.soundObject.play();
            }

            if (!this.soundIntervals[index]) {
                return;
            }

            //if (this.soundObject.networkState !== this.soundObject.NETWORK_IDLE) {
            //    return
            //}

            // this.pauseSound();

            try {
                this.soundObject.currentTime = this.soundIntervals[index][0];

                this.currentSound = index;
                this.isLooped = isLooped;
                this.ended = false;

                this.soundObject.currentTime = this.soundIntervals[this.currentSound][0];
                this.soundObject.volume = 1;

                if (this.soundObject.paused) {
                    this.soundObject.volume = 1;
                    this.soundObject.play();
                }
            }
            catch (e) {
                this.currentSound = -1;
                this.pauseSound();
            }
        }
    };


    function init() {
        if (document.readyState === 'completed' || document.readyState == 'loaded' || document.readyState == 'interactive') {
            Media._init();
        }
        else {
            document.addEventListener('DOMContentLoaded', init, false);
        }
    }

    init();

    module.Media = Media;
    //module.AudioSource = AudioSource;

    function loadAudio(uri) {
        var audio = new Audio();
        //audio.onload = isAppLoaded; // It doesn't works!
        audio.addEventListener('canplaythrough', isAppLoaded, false); // It works!!
        audio.src = uri;
        return audio;
    }

    //module.loadAudio = loadAudio;
});
defineModule('game5', ['jsshiv', 'jsextend', 'css', 'Loader', 'animation', 'audio'], function (module, $r) {

    /**
     * @overview PairsGame module
     * @author tvolodimir@gmail.com
     */

    'use strict';

    var setcss = $r('css').setcss;
    var extend = $r('jsextend').extend;
    var Loader = $r('Loader').Loader;
    var Emitter = $r('animation').Emitter;
    var Throttle = $r('animation').Throttle;
    var animate2 = $r('animation').animate2;
    var Media = $r('audio').Media;

    /**
     * copy array
     * @param {Array} array
     * @return {Array}
     */
    var copyArray = function (array) {
        if (array === undefined) {
            return undefined;
        }
        if (array === null) {
            return null;
        }
        var r = [];
        for (var i = 0; i < array.length; i++) {
            r[i] = array[i];
        }
        return r;
    };
    /**
     * random sort
     * @param {Array} array
     * @returns {boolean}
     */
    var fisherYates = function (array) {
        var i = array.length, j, temp;
        if (i === 0) return false;
        while (--i) {
            j = Math.floor(Math.random() * ( i + 1 ));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return true;
    };
    /**
     * unbind element from parent
     * @param {HTMLElement} element
     */
    var unbindElement = function (element) {
        if (!element || !element.parentNode) {
            return;
        }
        element.parentNode.removeChild(element);
    };

    /**
     * Cell
     * @param {{value:Object, enable:Boolean, index:int}} options
     * @constructor
     * @class Cell
     */
    var Cell = function (options) {

        /**
         * count of rotates
         * @type {int}
         */
        this.rotatesCount = 0;

        /**
         * last trap Time
         * @type {number}
         */
        this.lastRotateTime = 0;

        /**
         * is rotated
         * @type {boolean}
         */
        this.isRotated = false;

        this.value = options.value;

        this.foundPair = null;

        this.enable = options.enable;

        this.index = options.index;
    };
    Cell.prototype = {
        constructor: Cell,

        rotate: function () {
            if (this.isRotated === false) {
                this.lastRotateTime = Date.now();
                this.isRotated = true;
                this.rotatesCount++;
                return {
                    result: true,
                    value: this.value
                };
            }
            return {
                result: false,
                value: null
            };
        }
    };

    /**
     * Game
     * @param {{rowsCount:int, columnsCount:int, cellsEnables:boolean[], values:int[]}} options
     * @constructor
     * @class
     */
    var Game = function (options) {
        /**
         * cells
         * @type {Cell[]}
         */
        this.cells = [];
        this.rotatedCells = [];
        this.pairs = [];

        this.options = options;
        this._init();

        this.pairsToWin = (this.cells.length / 2) | 0;

        this.turns = [];

        this.score = 0;
    };
    Game.prototype = {
        constructor: Game,
        _init: function () {
            var op = this.options;

            for (var j = 0; j < op.rowsCount; j++) {
                for (var i = 0; i < op.columnsCount; i++) {
                    var cell = new Cell({
                        columnIndex: i,
                        enable: op.cellsEnables[j * op.columnsCount + i],
                        index: j * op.columnsCount + i,
                        value: op.values[j * op.columnsCount + i]
                    });
                    this.cells.push(cell);
                }
            }
        },
        /**
         * rotate
         * @param {int} cellIndex
         */
        rotate: function (cellIndex) {
            var cell = this._findCell(cellIndex);
            if (cell === null || cell === undefined) {
                return {
                    result: false
                };
            }
            var r = cell.rotate();
            if (r.result === true) {
                this.rotatedCells.push(cell);

                var ret = this._onRotated();

                var incScore = (ret.match === true) ? 10 : 0;

                var turn = {
                    index: cellIndex,
                    time: Date.now(),
                    score: this.score,
                    incScore: incScore
                };

                this.turns.push(turn);

                this.score += incScore;

                return extend({
                    result: true,
                    firstTurnTime: this.turns[0].time,
                    turn: turn,
                    turnsCount: this.turns.length,
                    isEnd: this.pairsToWin === this.pairs.length
                }, ret);
            }
            return {
                result: false
            };
        },
        _findCell: function (cellIndex) {
            for (var i = 0; i < this.cells.length; i++) {
                var t = this.cells[i];
                if (t.index === cellIndex) {
                    return t;
                }
            }
            return null;
        },
        _onRotated: function () {
            var rotatedCopy = [];
            for (var i = 0; i < this.rotatedCells.length; i++) {
                var c = this.rotatedCells[i];
                rotatedCopy[i] = {
                    index: c.index,
                    value: c.value
                }
            }
            if (this.rotatedCells.length === 2) {
                var match = null;
                if (this.rotatedCells[0].value === this.rotatedCells[1].value) {
                    var pair = [this.rotatedCells[0], this.rotatedCells[1]];
                    this.rotatedCells[0].foundPair = pair;
                    this.rotatedCells[1].foundPair = pair;
                    this.pairs.push([this.rotatedCells[0].index, this.rotatedCells[1].index]);
                    match = true;
                }
                else {
                    match = false;
                    this.rotatedCells[0].isRotated = false;
                    this.rotatedCells[1].isRotated = false;
                }
                this.rotatedCells = [];
            }
            return {
                match: match,
                rotated: rotatedCopy
            };
        }
    };

    /**
     * CellUI
     * @param {{rowIndex:int, columnIndex:int, board:BoardUI, enable:Boolean, index:int}} options
     * @constructor
     * @class CellUI
     */
    var CellUI = function (options) {
        this.enable = options.enable === undefined ? true : options.enable;
        this.index = options.index;

        this.board = options.board;
        this.columnIndex = options.columnIndex;
        this.rowIndex = options.rowIndex;

        var op = this.board.options;

        this.cellElement = document.createElement("div");
        this.cellElement.classList.add('cell');
        setcss(this.cellElement, {
            left: this.columnIndex * (op.cellWidth + op.paddingWidth) + 'px',
            top: this.rowIndex * (op.cellHeight + op.paddingHeight) + 'px',
            width: op.cellWidth + 'px',
            height: op.cellHeight + 'px'
        });
        op.container.insertAdjacentElement('beforeEnd', this.cellElement);

        this.cellElementFront = document.createElement("div");
        this.cellElementFront.classList.add('cellFront');
        this.cellElement.insertAdjacentElement('beforeEnd', this.cellElementFront);

        this.cellElementBack = document.createElement("canvas");
        this.cellElementBack.classList.add('cellBack');
        this.cellElement.insertAdjacentElement('beforeEnd', this.cellElementBack);

        this.cellElementBack.width = op.cellWidth;
        this.cellElementBack.height = op.cellHeight;
        this.ctx = this.cellElementBack.getContext('2d');

        var cell = this;
        this.cellElement.addEventListener("mousedown", function () {
            cell._onClick();
        }, false);

        this.__onFrontfaced = function () {
            cell._onFrontfaced();
        };
        this.isAnimating = false;
    };
    CellUI.prototype = {
        constructor: CellUI,
        _findCell: function (index, cells) {
            for (var i = 0; i < cells.length; i++) {
                var t = cells[i];
                if (t.index === index) {
                    return t;
                }
            }
            return null;
        },
        _setProxy: function (proxy) {
            var op = this.board.options;
            var c = this.ctx;
            var img = getResource(imageResources, 'card' + proxy.value);
            if (img) {
                c.drawImage(img.data, 0, 0, img.data.width, img.data.height, 0, 0, op.cellWidth, op.cellHeight);
            }
            else {
                c.fillStyle = "#00F";
                c.font = 'bold 30pt Arial';
                c.fillText(proxy.value, 20, 50);
            }
        },
        _animateToBackface: function (cb) {
            var cell = this;
            //if (cell.isAnimating === true) return;
            cell.isAnimating = true;
            animate2(this, '_animation_ToBackface', 0, 500,
                function () {
                    setcss(cell.cellElement, {
                        'animation-name': 'cellAnimation',
                        'animation-duration': '500ms',
                        'animation-fill-mode': 'forwards'
                    });
                },
                function () {
                    cell.cellElement.classList.add('cellFlipped');
                    setcss(cell.cellElement, {
                        'animation-name': 'none'
                    });
                    if (typeof cb === 'function') {
                        cb();
                    }
                },
                function () {
                    cell.isAnimating = false;
                });
            if (this.board.paused && this['_animation_ToBackface']) this['_animation_ToBackface'].pause();
        },
        _animateToFrontface: function (cb) {
            var cell = this;
            //if (cell.isAnimating === true) return;
            cell.isAnimating = true;
            animate2(this, '_animation_ToFrontface', 0, 500,
                function () {
                    setcss(cell.cellElement, {
                        'animation-name': 'cellAnimationBack',
                        'animation-duration': '500ms',
                        'animation-fill-mode': 'forwards'
                    });
                },
                function () {
                    cell.cellElement.classList.remove('cellFlipped');
                    setcss(cell.cellElement, {
                        'animation': 'none'
                    });
                    if (typeof cb === 'function') {
                        cb();
                    }
                },
                function () {
                    cell.isAnimating = false;
                });
            if (this.board.paused && this['_animation_ToFrontface']) this['_animation_ToFrontface'].pause();
        },
        _animateToHide: function (cb) {
            var cell = this;
            //if (cell.isAnimating === true) return;
            cell.isAnimating = true;
            animate2(this, '_animation_ToHide', 0, 1500,
                function () {
                    setcss(cell.cellElement, {
                        'animation-name': 'cellAnimationHide',
                        'animation-duration': '1500ms',
                        'animation-fill-mode': 'forwards'
                    });
                    cell.cellElement.classList.add('cellHide');
                },
                function () {
                    cell.cellElement.classList.add('cellHide');
                    setcss(cell.cellElement, {
                        'animation': 'none'
                    });
                    if (typeof cb === 'function') {
                        cb();
                    }
                },
                function () {
                    cell.isAnimating = false;
                });
            if (this.board.paused && this['cellAnimationHide']) this['cellAnimationHide'].pause();
        },
        isEnable: function () {
            return !this['_animation_ToBackface'] && !this['_animation_ToFrontface'] && !this['_animation_ToHide'] && !this.isAnimating && !this.cellElement.classList.contains('cellFlipped');
        },
        _onClick: function () {
            var cell = this;
            if (this.isEnable()) {
                if (!this.cellElement.classList.contains('cellFlipped')) {

                    GameProxy.current.rotate(cell.index, function (ret) {
                        if (ret.result === true) {
                            cell.isAnimating = true;
                            console.log(ret);
                            var cell1, cell2;
                            cell._animateToBackface(function () {
                                if (ret.match === true) {
                                    cell1 = cell.board.getCellByIndex(ret.rotated[0].index);
                                    cell1.enable = false;
                                    cell1._animateToHide();
                                    cell2 = cell.board.getCellByIndex(ret.rotated[1].index);
                                    cell2.enable = false;
                                    cell2._animateToHide();
                                }
                                else if (ret.match === false) {
                                    cell1 = cell.board.getCellByIndex(ret.rotated[0].index);
                                    cell1._animateToFrontface(cell.__onFrontfaced);
                                    cell2 = cell.board.getCellByIndex(ret.rotated[1].index);
                                    cell2._animateToFrontface(cell.__onFrontfaced);
                                }
                                else {
                                    // no pair yet
                                }
                            });
                            cell._setProxy(cell._findCell(cell.index, ret.rotated));
                        }
                    });
                }
            }
        },
        _onFrontfaced: function () {
            var op = this.board.options;
            var c = this.ctx;
            c.clearRect(0, 0, op.cellWidth, op.cellHeight);
        },
        pause: function () {
            if (this['_animation_ToBackface']) this['_animation_ToBackface'].pause();
            if (this['_animation_ToFrontface']) this['_animation_ToFrontface'].pause();
            if (this['_animation_ToHide']) this['_animation_ToHide'].pause();
            //this.fixTransform = getStyle(this.cellElement).webkitTransform;
            setcss(this.cellElement, {
                //'transform': this.fixTransform,
                'animation-play-state': 'paused'
            });
        },
        resume: function () {
            if (this['_animation_ToBackface']) this['_animation_ToBackface'].resume();
            if (this['_animation_ToFrontface']) this['_animation_ToFrontface'].resume();
            if (this['_animation_ToHide']) this['_animation_ToHide'].resume();
            setcss(this.cellElement, {
                //'transform': this.fixTransform,
                'animation-play-state': 'running'
            });
        }
    };

    /**
     * BoardUI
     * @param options
     * @constructor
     * @class BoardUI
     */
    var BoardUI = function (options) {
        this.options = extend({
            container: window.document.body,
            rowsCount: 5,
            columnsCount: 5,
            paddingWidth: 1,
            paddingHeight: 1,
            cellWidth: 50,
            cellHeight: 50
        }, options);

        /**
         * cells
         * @type {CellUI[]}
         * @private
         */
        this._cells = [];

        this.paused = false;

        this._init();
    };
    BoardUI.prototype = {
        constructor: BoardUI,
        destructor: function (cb) {
            for (var i = 0; i < this._cells.length; i++) {
                unbindElement(this._cells[i].cellElement);
            }
            this._cells.length = 0;
            cb();
        },

        _init: function () {
            var op = this.options;

            for (var j = 0; j < op.rowsCount; j++) {
                for (var i = 0; i < op.columnsCount; i++) {
                    var cell = new CellUI({
                        board: this,
                        rowIndex: j,
                        columnIndex: i,
                        enable: op.cellsEnables[j * op.columnsCount + i],
                        index: j * op.columnsCount + i
                    });
                    this._cells.push(cell);
                }
            }
        },
        /**
         * get Position Information
         * @param {Number} x
         * @param {Number} y
         * @returns {{rowIndex:int, columnIndex:int, localPosition:{x:Number, y:Number}}}
         */
        getPositionInformation: function (x, y) {
            var op = this.options;

            var rowIndex = Math.floor(y / (op.cellHeight + op.paddingHeight));
            var columnIndex = Math.floor(x / (op.cellWidth + op.paddingWidth));

            if (rowIndex > -1 && columnIndex > -1 && rowIndex < op.columnsCount && columnIndex < op.rowsCount) {
                var localPosition = {
                    x: x - columnIndex * (op.cellWidth + op.paddingWidth),
                    y: y - rowIndex * (op.cellHeight + op.paddingHeight)
                };
                if ((localPosition.x < op.cellWidth ) && (localPosition.y < op.cellHeight)) {
                    return {
                        rowIndex: rowIndex,
                        columnIndex: columnIndex,
                        localPosition: localPosition
                    };
                }
            }
            return null;
        },
        /**
         * get cell
         * @param {int} columnIndex
         * @param {int} rowIndex
         * @returns {Cell}
         */
        getCell: function (columnIndex, rowIndex) {
            var cell = this._cells[rowIndex * this.options.columnsCount + columnIndex];
            return cell ? cell : null;
        },
        /**
         * get Cell by Index
         * @param {int} index
         * @return {CellUI}
         */
        getCellByIndex: function (index) {
            for (var i = 0; i < this._cells.length; i++) {
                if (this._cells[i].index === index) {
                    return this._cells[i];
                }
            }
            return null;
        },

        pause: function () {
            if (this.paused === true) return;
            this.paused = true;
            for (var i = 0; i < this._cells.length; i++) {
                this._cells[i].pause();
            }

            this.options.container.classList.add('paused');
        },
        resume: function () {
            if (this.paused === false) return;
            this.paused = false;
            for (var i = 0; i < this._cells.length; i++) {
                this._cells[i].resume();
            }
            this.options.container.classList.remove('paused');
        }
    };

    var GameProxy = function () {
        this._initBase();
        this.stats = {
            gamesStats: []
        };
        this.gameIndex = 0;
        this.state = {
            initialized: false,
            disposing: false,
            playerInputEnable: false,
            value: 'notinitialized',
            startTime: null,
            score: 0,
            incScore: 0,
            turnsCount: 0
        };
    };
    GameProxy.prototype = {
        /**
         * static initialize
         * @private
         */
        _initBase: function () {
            this.gameContainer = document.querySelector('#game5-container');
            this.gameViewport = this.gameContainer.querySelector('.game-viewport');
            this.gameStage = this.gameContainer.querySelector('.game-stage');
            this.boardContainer = this.gameContainer.querySelector('.game-board');
            this.gameStat = this.gameContainer.querySelector('.game-stat');
            this.btnStart = this.gameContainer.querySelector('.btn-start');

            var g = this;

            this.btnStart.addEventListener("mousedown", function () {
                g.btnStart.classList.remove('visible');
                g.createNewGame();
            }, false);

            this.audio1 = Media.create(rootFolder + audioResources[0].src, [[0, 0.105]]);
            this.audio1.onLoaded = function () {
                // TODO
            };

            new Loader(imageResources, rootFolder).load(function () {
                // TODO
            });
        },
        /**
         * init game
         * @param {{columnsCount:int, rowsCount:int, cellsEnables:boolean[], pairs:int[][]}} options
         * @constructor
         */
        _initGameUI: function (options) {
            this.op = {
                columnsCount: options.columnsCount,
                rowsCount: options.rowsCount,
                cellWidth: 150/2,
                cellHeight: 190/2,
                paddingWidth: 7,
                paddingHeight: 7
            };
            var op = this.op;
            var w = op.columnsCount * op.cellWidth + op.paddingWidth * (op.columnsCount - 1);
            var h = op.rowsCount * op.cellHeight + op.paddingHeight * (op.rowsCount - 1);

            var containerSize = {width: w + 50, height: h + 100};

            setcss(this.gameViewport, {
                width: containerSize.width + 'px',
                height: containerSize.height + 'px'
            });

            this._updateControl({score: 0, time: 0, turns: 0});

            this.board = new BoardUI(extend({
                container: this.boardContainer,
                cellsEnables: options.cellsEnables
            }, this.op));
        },
        onGameOver: function () {
            this.btnStart.classList.add('visible');
        },
        createNewGame: function () {
            var that = this;
            if (this.state.initialized === true) {
                // save current state
                if (this.state.disposing === false) {
                    console.log('disposing');
                    this.state.disposing = true;
                    this.stats.gamesStats.push({
                        endInitiator: 'user',
                        endTime: Date.now()
                    });
                    this.board.destructor(function () {
                        that.state.disposing = false;
                        that.state.initialized = false;
                        that.createNewGame();
                    });
                }
                return;
            }

            this.gameIndex++;

            var op = {
                rowsCount: 4,
                columnsCount: 4,
                cellsCount: 16,
                cellsEnables: [],
                gameIndex: this.gameIndex,
                values: [],
                pairs: [],
                startTime: Date.now()
            };

            var cellsValues = [];
            for (var i = 0; i < op.cellsCount; i++) {
                op.cellsEnables[i] = 1;
                cellsValues[i] = ((i/2)|0) % 3;
            }
            fisherYates(cellsValues);

            op.values = cellsValues;

            this.currentGameOptiont = extend({
                cellsValue: cellsValues
            }, op);

            this.currentGame = new Game(op);
            console.log('creating new');
            this._initGameUI({
                rowsCount: op.rowsCount,
                columnsCount: op.columnsCount,
                cellsEnables: op.cellsEnables,
                pairs: op.pairs
            });
            this.state.initialized = true;
        },
        /**
         * update game stats
         * @param {{score:int, time:int, turns:int}} state
         * @private
         */
        _updateControl: function (state) {
            var s = this.state;
            if (state === undefined) state = {};
            if (state.score === undefined) state.score = s.score + s.incScore;
            if (state.time === undefined) state.time = Math.round((Date.now() - s.startTime) / 1000);
            if (state.turns === undefined) state.turns = s.turnsCount;
            this.gameStat.querySelector(".score span").innerHTML = state.score;
            this.gameStat.querySelector(".time span").innerHTML = state.time;
            this.gameStat.querySelector(".turns span").innerHTML = state.turns;
        },
        /**
         * proxy call to rotate
         * @param {int} cellIndex
         * @param {function} cb
         */
        rotate: function (cellIndex, cb) {
            var that = this;
            this.audio1.playSound(0, false);
            var ret = this.currentGame.rotate(cellIndex);
            if (ret.result === true) {
                var s = that.state;
                s.score = ret.turn.score;
                s.incScore = ret.turn.incScore;
                s.turnsCount = ret.turnsCount;

                if (this.state.startTime === null) {
                    s.startTime = ret.firstTurnTime;

                    this.state.emitter = new Emitter();
                    this.state.emitter.join(new Throttle(500)).join({next: function () {
                        that._updateControl();
                    }});
                    this.state.emitter.start();
                }

                if (ret.isEnd === true) {
                    this.state.emitter.stop();
                    this._updateControl();
                    this.state.startTime = null;

                    this.onGameOver();
                }
            }
            cb(ret);
        }
    };

    var audioResources = [
        {
            name: 'click',
            src: 'assets/audio/107146__bubaproducer__button-27.wav'
        }
    ];

    var imageResources = [
        {
            name: 'card0',
            src: 'assets/twinsclub/CardApple.png'
        },
        {
            name: 'card1',
            src: 'assets/twinsclub/CardBird.png'
        },
        {
            name: 'card2',
            src: 'assets/twinsclub/CardTree.png'
        },
        {
            name: 'cardBack',
            src: 'assets/twinsclub/CardBackSide.png'
        }
    ];

    var getResource = function (resources, name) {
        for (var i = 0; i < resources.length; i++) {
            if (resources[i].name === name) {
                return resources[i];
            }
        }
        return null;
    };

    var rootFolder = '';

    module.Game = {
        setRoot: function (root) {
            rootFolder = root;
        },
        init: function () {
            GameProxy.current = new GameProxy();
        },
        createNewGame: function () {
            GameProxy.current.createNewGame();
        },
        pause: function () {
            GameProxy.current.board.pause();
        },
        resume: function () {
            GameProxy.current.board.resume();
        },
        dispose: function () {
            if (GameProxy.current.board) {
                GameProxy.current.board.destructor();
            }
        },
        muteMusic: function () {

        },
        muteSounds: function () {

        },
        setMusicVolume: function (value) {

        },
        setSoundsVolume: function (value) {

        },
        getMusicVolume: function () {

        },
        getSoundsVolume: function () {

        },
        getStats: function () {

        },
        onExit: function () {

        },
        demo: function () {
            var cells = GameProxy.current.board._cells;
            var copycells = copyArray(cells);
            fisherYates(copycells);
            for (var i = 0; i < cells.length; i++) {
                copycells[i].onClick();
            }
        },
        demo2: function () {
            var cells = GameProxy.current.board._cells;
            var enableCells = [];
            var notfound = 0;
            var triedpairs = [];

            var func = function () {
                var i, j;
                enableCells = [];
                notfound = 0;
                for (i = 0; i < cells.length; i++) {
                    if (cells[i].enable) notfound++;
                    if (cells[i].enable && cells[i].isEnable())
                        enableCells.push(i);
                }
                if (enableCells.length > 1) {
                    console.log('enableCells %s', enableCells.length, enableCells);
                    var n = enableCells.length;
                    //var k = n*(n-1)/2;
                    var enablesPairs = 0;
                    var used = [];
                    var index = 0;

                    for (j = 0; j < enableCells.length - 1; j++) {
                        var p = triedpairs[enableCells[j]];
                        if (p === undefined) {
                            index += (enableCells.length - 1 - j);
                            enablesPairs += (enableCells.length - 1 - j);
                        }
                        else {
                            for (i = j + 1; i < enableCells.length; i++) {
                                if (p[enableCells[i]] === undefined) {
                                    enablesPairs += 1;
                                }
                                else {
                                    used.push(index)
                                }
                                index++;
                            }
                        }
                    }

                    if (enablesPairs > 0) {
                        var t = generateRandomSubArray(enablesPairs, 1)[0];
                        for (j = 0; j < used.length; j++) {
                            if (used[j] <= t) {
                                t++;
                            }
                        }
                        console.log('enablesPairs %s allPairs %s pairIndex %s', enablesPairs, n * (n - 1) / 2, t);
                        index = 0;
                        var pair;
                        for (j = 0; j < n - 1; j++) {
                            var d = n - 1 - j;
                            if (index + d > t) {
                                pair = [enableCells[j], enableCells[j + 1 + t - index]];
                                break;
                            }
                            index += d;
                        }
                        console.log('pair %s %s', pair[0], pair[1]);
                        if (triedpairs[pair[0]] === undefined) {
                            triedpairs[pair[0]] = [];
                        }
                        triedpairs[pair[0]][pair[1]] = 1;

                        cells[pair[0]].onClick();
                        cells[pair[1]].onClick();
                    }
                }
                if (notfound > 0)
                    setTimeout(func, 400);
            };
            func();
        }
    };
});
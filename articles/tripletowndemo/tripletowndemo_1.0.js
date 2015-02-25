/**
 * Created by tvolodimir. 2011.
 * tvolodimir@gmail.com
 */

var Sprite = {
    nothing: 0,
    grass: 1,
    bush: 2,
    bush_plus: 3,
    tree: 4,
    tree_plus: 5,
    hut: 6,
    hut_plus: 7,
    house:8,
    house_plus:9,
    mansion:10,
    mansion_plus:11,
    castle:12,
    flytown:13,
    flycastle:14,
    bear: 18,
    tombstone: 19,
    church: 20,
    cathedral: 21,

    stone:15,
    saver:16,
    outbound:17
};

var Map = function(width,height,imgs){
    this.width = width;
    this.height = height;
    var x, y;
    this.map = [];
    for (x = 0; x < width; x++) {
        this.map[x] = [];
        for (y = 0; y < height; y++) {
            this.map[x][y] = Sprite.nothing;
        }
    }
    this.mapNoise = [];
    for (x = 0; x < 2 * width; x++) {
        this.mapNoise[x] = [];
        for (y = 0; y < 2 * height; y++) {
            this.mapNoise[x][y] = Math.floor(Math.random() * 2);
        }
    }
    this.randomize();
    this.imgs = imgs;

    this.animkey = 0;
    this.activeColapse = [];
    this.activeColapseTimer = 0;
};
Map.prototype.randomize = function() {
    var needAdd = Math.floor(this.width * this.height * 0.25);
    var found = false;
    var rndCol = 0;
    var rndRow = 0;

    for (var i = 0; i < needAdd; i++) {
        found = false;
        rndCol = 0;
        rndRow = 0;
        while (!found) {
            rndCol = Math.floor(Math.random() * this.width);
            rndRow = Math.floor(Math.random() * this.height);
            if (this.map[rndCol][rndRow] == Sprite.nothing) {
                found = true;
            }
        }
        this.map[rndCol][rndRow] = Math.floor(Math.random() * 3) + 10;
    }
    this.map[0][0] = Sprite.saver;
};
Map.prototype.paintBackground = function(ctx) {
    var x,y;
    var bg = this.imgs.background.data;
    ctx.save();
    ctx.transform(1, 0, 0, 1, 0, 0);
    for (x = 0; x <= this.width; x++) {
        ctx.drawImage(bg, 160, 0, 80, 80, x * 80, 0, 80, 80);
        ctx.drawImage(bg, 160, 0, 80, 80, x * 80, this.height * 80, 80, 80);
    }
    for (y = 0; y <= this.height; y++) {
        ctx.drawImage(bg, 160, 0, 80, 80, 0, y * 80, 80, 80);
        ctx.drawImage(bg, 160, 0, 80, 80, this.width * 80, y * 80, 80, 80);
    }
    ctx.translate(40, 40);
    for (x = 0; x < this.width; x++) {
        for (y = 0; y < this.height; y++) {
//            if(x==0 && y==0){
//                ctx.drawImage(bg, 160, 0, 80, 80, x * 80, y * 80, 80, 80);
//                continue;
//            }
            if (this.map[x][y] >= 1) {
                ctx.drawImage(bg, 160, 0, 80, 80, x * 80, y * 80, 80, 80);
            }
            else {
                var t = [];
                t[0] = (x > 0 && y > 0) ? ((this.map[x - 1][y - 1] > 0) ? 1 : 0) : 1;
                t[1] = (y > 0) ? ((this.map[x][y - 1] > 0) ? 1 : 0) : 1;
                t[2] = (x < (this.width - 1) && y > 0) ? ((this.map[x + 1][y - 1] > 0) ? 1 : 0) : 1;
                t[3] = (x < (this.width - 1)) ? ((this.map[x + 1][y] > 0) ? 1 : 0) : 1;
                t[4] = (x < (this.width - 1) && y < (this.height - 1)) ? ((this.map[x + 1][y + 1] > 0) ? 1 : 0) : 1;
                t[5] = (y < (this.height - 1)) ? ((this.map[x][y + 1] > 0) ? 1 : 0) : 1;
                t[6] = (x > 0 && y < (this.height - 1)) ? ((this.map[x - 1][y + 1] > 0) ? 1 : 0) : 1;
                t[7] = (x > 0) ? ((this.map[x - 1][y] > 0) ? 1 : 0) : 1;
                if (t[7] == 1) {
                    if (t[1] == 1) {
                        ctx.drawImage(bg, 120, 120 - 40 * this.mapNoise[x * 2][y * 2], 40, 40, x * 80, y * 80, 40, 40);
                    } else {
                        ctx.drawImage(bg, 80, 40 - 40 * this.mapNoise[x * 2][y * 2], 40, 40, x * 80, y * 80, 40, 40);
                    }
                }
                else {
                    if (t[1] == 1) {
                        ctx.drawImage(bg, 120, 40 - 40 * this.mapNoise[x * 2][y * 2], 40, 40, x * 80, y * 80, 40, 40);
                    } else {
                        if (t[0] == 1) {
                            ctx.drawImage(bg, 120, 200 - 40 * this.mapNoise[x * 2][y * 2], 40, 40, x * 80, y * 80, 40, 40);
                        }
                        else {
                            ctx.drawImage(bg, 160, 80, 40, 40, x * 80, y * 80, 40, 40);
                        }
                    }
                }

                if (t[1] == 1) {
                    if (t[3] == 1) {
                        ctx.drawImage(bg, 0, 120 - 40 * this.mapNoise[x * 2 + 1][y * 2], 40, 40, x * 80 + 40, y * 80, 40, 40);
                    } else {
                        ctx.drawImage(bg, 120, 40 - 40 * this.mapNoise[x * 2 + 1][y * 2], 40, 40, x * 80 + 40, y * 80, 40, 40);
                    }
                } else {
                    if (t[3] == 1) {
                        ctx.drawImage(bg, 0, 40 - 40 * this.mapNoise[x * 2 + 1][y * 2], 40, 40, x * 80 + 40, y * 80, 40, 40);
                    } else {
                        if (t[2] == 1) {
                            ctx.drawImage(bg, 0, 200 - 40 * this.mapNoise[x * 2 + 1][y * 2], 40, 40, x * 80 + 40, y * 80, 40, 40);
                        }
                        else {
                            ctx.drawImage(bg, 160, 80, 40, 40, x * 80 + 40, y * 80, 40, 40);
                        }
                    }
                }

                if (t[5] == 1) {
                    if (t[3] == 1) {
                        ctx.drawImage(bg, 40, 120 - 40 * this.mapNoise[x * 2 + 1][y * 2 + 1], 40, 40, x * 80 + 40, y * 80 + 40, 40, 40);
                    } else {
                        ctx.drawImage(bg, 40, 40 - 40 * this.mapNoise[x * 2 + 1][y * 2 + 1], 40, 40, x * 80 + 40, y * 80 + 40, 40, 40);
                    }
                } else {
                    if (t[3] == 1) {
                        ctx.drawImage(bg, 0, 40 - 40 * this.mapNoise[x * 2 + 1][y * 2 + 1], 40, 40, x * 80 + 40, y * 80 + 40, 40, 40);
                    } else {
                        if (t[4] == 1) {
                            ctx.drawImage(bg, 40, 200 - 40 * this.mapNoise[x * 2 + 1][y * 2 + 1], 40, 40, x * 80 + 40, y * 80 + 40, 40, 40);
                        }
                        else {
                            ctx.drawImage(bg, 160, 80, 40, 40, x * 80 + 40, y * 80 + 40, 40, 40);
                        }
                    }
                }

                if (t[5] == 1) {
                    if (t[7] == 1) {
                        ctx.drawImage(bg, 80, 120 - 40 * this.mapNoise[x * 2][y * 2 + 1], 40, 40, x * 80, y * 80 + 40, 40, 40);
                    } else {
                        ctx.drawImage(bg, 40, 40 - 40 * this.mapNoise[x * 2][y * 2 + 1], 40, 40, x * 80, y * 80 + 40, 40, 40);
                    }
                } else {
                    if (t[7] == 1) {
                        ctx.drawImage(bg, 80, 40 - 40 * this.mapNoise[x * 2][y * 2 + 1], 40, 40, x * 80, y * 80 + 40, 40, 40);
                    } else {
                        if (t[6] == 1) {
                            ctx.drawImage(bg, 80, 200 - 40 * this.mapNoise[x * 2][y * 2 + 1], 40, 40, x * 80, y * 80 + 40, 40, 40);
                        }
                        else {
                            ctx.drawImage(bg, 160, 80, 40, 40, x * 80, y * 80 + 40, 40, 40);
                        }
                    }
                }
            }
        }
    }

    ctx.restore();
};
Map.prototype.paintSprites = function(ctx) {
    ctx.save();
    ctx.transform(1, 0, 0, 1, 0, 0);
    ctx.translate(40, 40);
	var imgs = this.imgs;
    function found(query, x, y) {
        for (var i = 0; i < query.length; i++) {
            if ((query[i][0] == x) && (query[i][1] == y))
                return true;
        }
        return false;
    }
    var x,y;
    var kx,ky = 0;
    for (x = 0; x < this.width; x++) {
        for (y = 0; y < this.height; y++) {
            if (x == 0 && y == 0) {
                ctx.drawImage(imgs.savedock.data, 0, 0, 80, 160, x * 80, (y - 1) * 80, 80, 160);
                var scale = 0.8;
                var offsetx = 0.5 * 80 * (1 - scale);
                var offsety = 1.8 * 80 * (1 - scale);
                ctx.drawImage(imgs["tree_plus"].data, 0, 0, 80, 160, x * 80 + offsetx, (y - 1) * 80 + offsety, 80 * scale, 160 * scale);
            }
            else if (this.map[x][y] >= 1) {
                kx = 0;
                ky = 0;
                if (this.activeColapse.length > 0 && found(this.activeColapse, x, y)) {
                    if (x == this.lastMouseCellX)
                        kx = 0;
                    else
                        kx = 5 * ((this.lastMouseCellX > x) ? 1 : -1) * Math.sin(this.activeColapseTimer * Math.PI / 5);
                    if (y == this.lastMouseCellY)
                        ky = 0;
                    else
                        ky = 5 * ((this.lastMouseCellY > y) ? 1 : -1) * Math.sin(this.activeColapseTimer * Math.PI / 5);
                }

                var type = this.getMapItem(x,y);
                var im = this.getImageByType(type);
                if(im==null){
                    console.log(type,x,y);
                }
                var img = im.data;
                var imgshadow = imgs["shadow"].data;
                if (this.map[x][y] == Sprite.flytown) {
                    ctx.globalAlpha = (Math.cos(2 * Math.PI * this.animkey / 56 + 1.5) + 1) / 2 + 0.5;
                    ctx.drawImage(imgshadow, 0, 0, 80, 160, x * 80 + kx, (y - 1) * 80 + ky, 80, 160);
                    ctx.globalAlpha = 1;
                    var offsety = 5 * Math.cos(2 * Math.PI * this.animkey / 56 + 1.5) - 5;
                    ctx.drawImage(img, 0, 0, 80, 160, x * 80 + kx, (y - 1) * 80 + ky + offsety, 80, 160);
                }
                else if (this.map[x][y] == Sprite.flycastle) {
                    var offsety = 3 * Math.cos(2 * Math.PI * this.animkey / 56) - 3;
                    ctx.drawImage(imgshadow, 0, 0, 80, 160, x * 80 + kx, (y - 1) * 80 + ky, 80, 160);
                    ctx.drawImage(img, 0, 0, 80, 160, x * 80 + kx, (y - 1) * 80 + ky + offsety, 80, 160);
                }
                else {
                    ctx.drawImage(imgshadow, 0, 0, 80, 160, x * 80 + kx, (y - 1) * 80 + ky, 80, 160);
                    ctx.drawImage(img, 0, 0, 80, 160, x * 80 + kx, (y - 1) * 80 + ky, 80, 160);
                }
            }
        }
    }
    ctx.restore();
};
Map.prototype.getMapItem = function(x, y) {
    if (x < 0 || x >= this.width)return Sprite.outbound;
    if (y < 0 || y >= this.height)return Sprite.outbound;
    return this.map[x][y];
};
Map.prototype.canScope = function(x, y, type) {
    var item = this.getMapItem(x, y);
    if (type == Sprite.grass) {
        return item == Sprite.grass;
    }
    if (type == Sprite.bush || type == Sprite.bush_plus) {
        return item == Sprite.bush || item == Sprite.bush_plus;
    }
    else if (type == Sprite.tree || type == Sprite.tree_plus) {
        return item == Sprite.tree || item == Sprite.tree_plus;
    }
    else if (type == Sprite.hut || type == Sprite.hut_plus) {
        return item == Sprite.hut || item == Sprite.hut_plus;
    }
    else if (type == Sprite.house || type == Sprite.house_plus) {
        return item == Sprite.house || item == Sprite.house_plus;
    }
    else if (type == Sprite.mansion || type == Sprite.mansion_plus) {
        return item == Sprite.mansion || item == Sprite.mansion_plus;
    }
    else if (type == Sprite.castle) {
        return item == Sprite.castle;
    }
    else if (type == Sprite.flytown) {
        return item == Sprite.flytown;
    }
    else if (type == Sprite.flycastle) {
        return false;// item == Sprite.flycastle;
    }
    return false;
};
Map.prototype.checkCollapse = function(indexX, indexY, type) {
    function found(query, x, y) {
        for (var i = 0; i < query.length; i++) {
            if ((query[i][0] == x) && (query[i][1] == y))
                return true;
        }
        return false;
    }

    var query = [];
    query.push([indexX,indexY]);
    var checked = [];

    while (query.length > 0) {
        var item = query.pop();
        checked.push([item[0],item[1]]);
        if (this.canScope(item[0], item[1] - 1, type) && !found(checked, item[0], item[1] - 1) && !found(query, item[0], item[1] - 1)) {
            query.push([item[0],item[1] - 1]);
        }
        if (this.canScope(item[0], item[1] + 1, type) && !found(checked, item[0], item[1] + 1) && !found(query, item[0], item[1] + 1)) {
            query.push([item[0],item[1] + 1]);
        }
        if (this.canScope(item[0] + 1, item[1], type) && !found(checked, item[0] + 1, item[1]) && !found(query, item[0] + 1, item[1])) {
            query.push([item[0] + 1,item[1]]);
        }
        if (this.canScope(item[0] - 1, item[1], type) && !found(checked, item[0] - 1, item[1]) && !found(query, item[0] - 1, item[1])) {
            query.push([item[0] - 1,item[1]]);
        }
    }

    return checked;
};
Map.prototype.getImageByType = function(type) {
    var img = null;
    var imgs = this.imgs;
    if (type == Sprite.grass) {
        img = imgs["grass"];
    }
    else if (type == Sprite.bush) {
        img = imgs["bush"];
    }
    else if (type == Sprite.bush_plus) {
        img = imgs["bush_plus"];
    }
    else if (type == Sprite.tree) {
        img = imgs["tree"];
    }
    else if (type == Sprite.tree_plus) {
        img = imgs["tree_plus"];
    }
    else if (type == Sprite.hut) {
        img = imgs["hut"];
    }
    else if (type == Sprite.hut_plus) {
        img = imgs["hut_plus"];
    }
    else if (type == Sprite.house) {
        img = imgs["house"];
    }
    else if (type == Sprite.house_plus) {
        img = imgs["house_plus"];
    }
    else if (type == Sprite.mansion) {
        img = imgs.mansion;
    }
    else if (type == Sprite.mansion_plus) {
        img = imgs.mansion_plus;
    }
    else if (type == Sprite.castle) {
        img = imgs.castle;
    }
    else if (type == Sprite.flytown) {
        img = imgs["flytown"];
    }
    else if (type == Sprite.flycastle) {
        img = imgs["flycastle"];
    }
    return img;
};
Map.prototype.getUpperLevelSprite = function(type) {
    if (type == Sprite.grass)return Sprite.bush; else
    if (type == Sprite.bush)return Sprite.tree; else
    if (type == Sprite.bush_plus)return Sprite.tree; else
    if (type == Sprite.tree)return Sprite.hut; else
    if (type == Sprite.tree_plus)return Sprite.hut; else
    if (type == Sprite.hut)return Sprite.house; else
    if (type == Sprite.hut_plus)return Sprite.house; else
    if (type == Sprite.house)return Sprite.mansion; else
    if (type == Sprite.house_plus)return Sprite.mansion; else
    if (type == Sprite.mansion)return Sprite.castle; else
    if (type == Sprite.mansion_plus)return Sprite.castle; else
    if (type == Sprite.castle)return Sprite.flytown; else
    if (type == Sprite.flytown)return Sprite.flycastle;
};
Map.prototype.getPlusSprite = function(type) {
    if (type == Sprite.grass)return Sprite.grass; else
    if (type == Sprite.bush)return Sprite.bush_plus; else
    if (type == Sprite.bush_plus)return Sprite.bush_plus; else
    if (type == Sprite.tree)return Sprite.tree_plus; else
    if (type == Sprite.tree_plus)return Sprite.tree_plus; else
    if (type == Sprite.hut)return Sprite.hut_plus; else
    if (type == Sprite.hut_plus)return Sprite.hut_plus; else
    if (type == Sprite.house)return Sprite.house_plus; else
    if (type == Sprite.house_plus)return Sprite.house_plus; else
    if (type == Sprite.mansion)return Sprite.mansion_plus; else
    if (type == Sprite.castle)return Sprite.castle; else
    if (type == Sprite.flytown)return Sprite.flytown; else
    if (type == Sprite.flycastle)return Sprite.flycastle;
};
Map.prototype.updateCollapseItem = function(x,y,type){
    function removeArray(query, x, y) {
        for (var i = 0; i < query.length; i++) {
            if ((query[i][0] == x) && (query[i][1] == y))
                query.splice(i, 1);
        }
        return query;
    }

    if (this.getMapItem(x,y) == Sprite.nothing) {
        var a0 = this.checkCollapse(x, y, type);
        if (a0.length > 2) {
            var next = this.getUpperLevelSprite(type);
            var a1 = this.checkCollapse(x, y, next);
            if (a1.length > 2) {
                next = this.getUpperLevelSprite(next);
                var a2 = this.checkCollapse(x, y, next);
                if (a2.length > 2) {
                    next = this.getUpperLevelSprite(next);
                    var a3 = this.checkCollapse(x, y, next);
                    if (a3.length > 2) {
                        next = this.getUpperLevelSprite(next);
                        this.activeColapse = removeArray(a0, x, y).concat(removeArray(a1, x, y)).concat(removeArray(a2, x, y)).concat(removeArray(a3, x, y))
                    }
                    else this.activeColapse = removeArray(a0, x, y).concat(removeArray(a1, x, y)).concat(removeArray(a2, x, y));
                }
                else this.activeColapse = removeArray(a0, x, y).concat(removeArray(a1, x, y));
            }
            else this.activeColapse = removeArray(a0, x, y);
        }
        else this.activeColapse = [];
    }
    else this.activeColapse = [];

    if (this.activeColapse.length > 0)this.activeColapseTimer = 0;
};
Map.prototype.setItemAndCollapse = function(x, y, type) {
    this.map[x][y] = type;
    var near = this.checkCollapse(x, y, type);
    if (near.length > 2) {
        for (var i = 0; i < near.length; i++) {
            this.map[near[i][0]][near[i][1]] = Sprite.nothing;
        }
        var next = this.getUpperLevelSprite(type);
        this.map[x][y] = (near.length < 4) ? next : this.getPlusSprite(next);
        return true;
    }
    return false;
};
Map.prototype.setItemAndCollapseAll = function(x,y,type){
    if (this.setItemAndCollapse(x, y, type)) {
        var next = this.getUpperLevelSprite(type);
        if (this.setItemAndCollapse(x, y, next)) {
            next = this.getUpperLevelSprite(next);
            if (this.setItemAndCollapse(x, y, next)) {
                next = this.getUpperLevelSprite(next);
                if (this.setItemAndCollapse(x, y, next)) {
                    next = this.getUpperLevelSprite(next);
                }
            }
        }
    }
};

var defaultInterval = 33;
window.requestAnimFrame = (function () {
    return  function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, defaultInterval);
        };
})();

var TripleTown = function() {
    var imgs = this.imgs = Storage.imageData;
    this.__proto__ = new App({
            loadList:[imgs["background"],
            imgs["grass"],
            imgs["bush"],
            imgs["bush_plus"],
            imgs["tree"],
            imgs["tree_plus"],
            imgs["hut"],
            imgs["hut_plus"],
            imgs["house"],
            imgs["house_plus"],
            imgs["mansion"],
            imgs["mansion_plus"],
            imgs["castle"],
            imgs["flytown"],
            imgs["flycastle"],
            imgs["rock"],
            imgs["mountain"],
            imgs["tombstone"],
            imgs["church"],
            imgs["cathedral"],
            imgs["goldchest"],
            imgs["silverchest"],
            imgs["crystal"],
            imgs["digger"],
            imgs["activerectangle"],
            imgs["savedock"],
            imgs["shadow"],
            imgs["test"]],
            canvasCount:2,
            defSize:[560,560]
        });
    this.imgs = Storage.imageData;
    this.map = new Map(6, 6, this.imgs);
    this.activeElement = Sprite.mansion;

    this.drawLayer1 = function(ctx, width, height) {
        this.map.paintBackground(ctx);
        this.map.paintSprites(ctx);
        if (this.map.lastMouseCellX > -1 && this.map.lastMouseCellY > -1) {
            var dx = -40;
            var dy = -40;
            var x = this.map.lastMouseCellX;
            var y = this.map.lastMouseCellY;
            var scale = 0.8;
            var offsetx = 0.5 * 80 * (1 - scale);
            var offsety = 1.99 * 80 * (1 - scale);
            if (this.map.getMapItem(x, y) == Sprite.nothing) {
                ctx.drawImage(this.imgs["activerectangle"].data, 0, 0, 80, 160, (x + 1) * 80 + dx, y * 80 + dy, 80, 160);
                ctx.drawImage(this.map.getImageByType(this.activeElement).data, 0, 0, 80, 160, (x + 1) * 80 + dx + offsetx, y * 80 + dy + offsety, 80 * scale, 160 * scale);
            }
            else {
                ctx.drawImage(this.map.getImageByType(this.activeElement).data, 0, 0, 80, 160, this.mouse.lastX - 80 + 40 * scale + offsetx, this.mouse.lastY - 120 + offsety, 80 * scale, 160 * scale);
            }
        }
        //ctx.drawImage(this.imgs["test"].data, this.map.animkey *330, 0, 330, 330, 0, 0, 560, 560);
        this.map.animkey++;
        if (this.map.animkey > 56) this.map.animkey = 0;
        this.map.activeColapseTimer++;
    };
    this.update = function () {
        this.isNeedLayersRedraw[0] = true;
        this.isNeedLayersRedraw[1] = true;
    };

    this.onMouseMove = function (posx, posy, event) {
        this.__proto__.onMouseMove(posx, posy, event);
        var x = Math.floor(( posx - 40) / 80);
        var y = Math.floor(( posy - 40) / 80);
        if (x == this.map.lastMouseCellX && y == this.map.lastMouseCellY) return;
        this.map.lastMouseCellX = x;
        this.map.lastMouseCellY = y;
        this.map.updateCollapseItem(x, y, this.activeElement);
    };
    this.onMouseDown = function (posx, posy, event) {
        this.__proto__.onMouseDown(posx, posy, event);
        var x = Math.floor(( posx - 40) / 80);
        var y = Math.floor(( posy - 40) / 80);
        if (x == this.map.lastMouseCellX || y == this.map.lastMouseCellY) {
            this.map.lastMouseCellX = x;
            this.map.lastMouseCellY = y;
            this.map.updateCollapseItem(x, y, this.activeElement);
        }
        if (this.map.getMapItem(x, y) == Sprite.nothing) {
            this.map.setItemAndCollapseAll(x, y, this.activeElement);
            this.activeElement = Math.floor(Math.random() * 5) + 8;
        }
    };
};




"use strict";

/**
 * Solver forces
 * @overview SolverForces module
 * @author tvolodimir@gmail.com
 * 2011
 */

var LinAlgebra = {
    SLARSolver: function (A, y) {
        var i, j;
        var y_initial = [];
        var A_initial = [];
        var n = y.length;
        for (i = 0; i < n; i++) {
            y_initial[i] = y[i];
            A_initial[i] = [];
            for (j = 0; j < n; j++)
                A_initial[i][j] = A[i][j];
        }
        var x = this.GaussianElimination(A, y);
        var u = [];
        var log = false;
        // Вычисление невязки решения
        // U = b - x * A
        // x - решение уравнения, полученное методом Гаусса
        for (i = 0; i < n; i++) {
            var actual_b_i = 0.0;   // результат перемножения i-строки
            // исходной матрицы на вектор x
            for (j = 0; j < n; j++)
                actual_b_i += A_initial[i][j] * x[j];
            // i-й элемент вектора невязки
            u[i] = y_initial[i] - actual_b_i;
            if (Math.abs(u[i]) > 1e-5) log = true;
        }
        //console.log('A');
        //console.log(A_initial);
        //console.log('y_initial');
        //console.log(y_initial);
        //console.log('x');
        //console.log(x);
        if (log) {
            console.log('u');
            console.log(u);
        }

        return x;
    },
    GaussianElimination: function (A, y) {
        // поиск главного элемента в матрице
        function FindR(row, index) {
            var n = y.length;
            var eps = 1e-18;
            var max_index = row;
            var max = A[row][index[max_index]];
            var max_abs = Math.abs(max);
            //if(row < size - 1)
            for (var cur_index = row + 1; cur_index < n; cur_index++) {
                var cur = A[row][index[cur_index]];
                var cur_abs = Math.abs(cur);
                if (cur_abs > max_abs) {
                    max_index = cur_index;
                    max = cur;
                    max_abs = cur_abs;
                }
            }

            if (max_abs < eps) {
                if (Math.abs(y[row]) > eps)
                    throw new Error("Система уравнений несовместна.");
                else
                    throw new Error("Система уравнений имеет множество решений.");
            }

            // меняем местами индексы столбцов
            var temp = index[row];
            index[row] = index[max_index];
            index[max_index] = temp;

            return max;
        }

        var n = y.length;
        var i, j, r;
        var index = [];
        var x = [];

        for (i = 0; i < n; i++) index[i] = i;
        // Прямой ход метода Гаусса
        // перемещаемся по каждой строке сверху вниз
        for (i = 0; i < n; i++) {
            // 1) выбор главного элемента
            r = FindR(i, index);

            // 2) преобразование текущей строки матрицы A
            for (j = 0; j < n; j++)
                A[i][j] /= r;

            // 3) преобразование i-го элемента вектора b
            y[i] /= r;

            // 4) Вычитание текущей строки из всех нижерасположенных строк
            for (var k = i + 1; k < n; k++) {
                var p = A[k][index[i]];
                for (j = i; j < n; j++)
                    A[k][index[j]] -= A[i][index[j]] * p;
                y[k] -= y[i] * p;
                A[k][index[i]] = 0.0;
            }
        }
        // Обратный ход метода Гаусса
        // перемещаемся по каждой строке снизу вверх
        for (i = n - 1; i >= 0; i--) {
            // 1) задаётся начальное значение элемента x
            var x_i = y[i];

            // 2) корректировка этого значения
            for (j = i + 1; j < n; j++)
                x_i -= x[index[j]] * A[i][index[j]];
            x[index[i]] = x_i;
        }

        return x;
    }
};

var IntersectionsHelper = {
    intersectCircles: function (x1, y1, r1, x2, y2, r2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var d2 = dx * dx + dy * dy;
        var d = Math.sqrt(d2);
        if ((r1 + r2) < d) return null;
        if (d < Math.abs(r1 - r2)) return null;
        var r12 = r1 * r1;
        var r22 = r2 * r2;
        var a = (r12 - r22 + d2) / (2 * d);
        var newx = x1 + a * dx / d;
        var newy = y1 + a * dy / d;
        if (r12 - a * a <= 0) {
            return [newx, newy];
        }
        else {
            var h = Math.sqrt(r12 - a * a);
            return [
                [newx + h * dy / d, newy - h * dx / d],
                [newx - h * dy / d, newy + h * dx / d]
            ];
        }
    },
    hardfindclosestpoints: function (ball, balls) {
        var res = [];
        var i, j, dx, dy, r, d;

        // перевірка чи перекривається кимось
        var collided = false;
        for (i = 0; i < balls.length; i++) {
            if (balls[i] != ball) {
                dx = balls[i].x - ball.x;
                dy = balls[i].y - ball.y;
                r = ball.radius + balls[i].radius;
                d = dx * dx + dy * dy - r * r;
                if (d < 0) {
                    collided = true;
                    break;
                }
            }
        }
        if (!collided) return null;

        var kk = 0;
        var intersectResult;
        for (i = 0; i < balls.length; i++) {
            // дотик до кола не в точці перетину кіл
            if (balls[i] != ball) {
                dx = balls[i].x - ball.x;
                dy = balls[i].y - ball.y;
                r = ball.radius + balls[i].radius;
                d = Math.sqrt((r * r) / (dx * dx + dy * dy));
                res.push([ball.x + dx * (1 + d), ball.y + dy * (1 + d), i, -1]);
                res.push([ball.x + dx * (1 - d), ball.y + dy * (1 - d), i, -1]);
            }

            // дотик до кола в точці перетину кіл
            for (j = i + 1; j < balls.length; j++) {
                if (i != j && balls[j] != ball && balls[i] != ball) {
                    kk++;
                    intersectResult = IntersectionsHelper.intersectCircles(
                        balls[j].x, balls[j].y, balls[j].radius + ball.radius,
                        balls[i].x, balls[i].y, balls[i].radius + ball.radius);
                    if (intersectResult != null) {
                        for (var k = 0; k < intersectResult.length; k++) {
                            res.push([intersectResult[k][0], intersectResult[k][1], i, j]);
                        }
                    }

                }
            }
        }
        var need = (balls.length - 1) * (balls.length - 2) / 2;
        if (kk != need) {
            console.log('kk = %s    must be = %s', kk, need);
        }

        // видаляємо точки які в середені куль
        for (i = 0; i < res.length; i++) {
            r = res[i];

            for (j = 0; j < balls.length; j++) {
                if (balls[j] != ball) {
                    if (length(balls[j].x, balls[j].y, r[0], r[1]) < balls[j].radius + ball.radius - .01) {
                        res.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
        }

        var mind = 9999999999999;
        var mindindexres = -1;
        var t;

        for (i = 0; i < res.length; i++) {
            r = res[i];
            t = length(ball.x, ball.y, r[0], r[1]);
            if (t < mind) {
                mind = t;
                mindindexres = i;
            }
        }

        if (mindindexres == -1) {
            console.log('mindindexres==-1 res.length %s', res.length);
            return null;
        }

        var results = [res[mindindexres]];
        for (i = 0; i < res.length; i++) {
            if (i == mindindexres)continue;
            t = length(res[mindindexres][0], res[mindindexres][1], res[i][0], res[i][1]);
            if (t < 0.1) {
                results.push(res[i]);
            }
        }

        return results;
    }
};

var ForsesSolver = {
    findTouch: function (touchings, i, j) {
        var touch;
        for (var k = 0; k < touchings.length; k++) {
            touch = touchings[k];
            if ((touch.i == i && touch.j == j) || (touch.i == j && touch.j == i))
                return touch;
        }
        return null;
    },
    getTouchings: function (balls) {
        var flag = [];
        var touchings = [];
        var touchs, touch, i, j;
        for (i = 0; i < balls.length; i++) {
            touchs = balls[i].touchinngs;
            for (j = 0; j < touchs.length; j++) {
                touch = touchs[j];
                if (flag.indexOf(touch[2]) == -1) {
                    var t = {i: i, j: touch[2], nx: touch[0], ny: touch[1]};
                    touchings.push(t);
                }
            }
            flag.push(i);

        }
        return touchings;
    },
    metaSolve2: function (balls) {
        var touchs, touch, i, j, ball;
        var touchings = this.getTouchings(balls);
        var initialtouchings = [];
        for (i = 0; i < touchings.length; i++) {
            initialtouchings[i] = touchings[i];
        }
        var r = this.solve2(balls, touchings);
        var iter = 1;
        var resolve;
        var log = '[start->\n\rcount all touchings = ' + touchings.length;
        do {
            resolve = false;
            for (i = 0; i < r.length; i++) {
                touch = touchings[i];
                if (r[i] > 0) {
                    if (touch.j > -1) {
                        if (touch.nx * (balls[touch.i].postForceX - balls[touch.j].postForceX) +
                            touch.ny * (balls[touch.i].postForceY - balls[touch.j].postForceY) < -1e-3) {
                            console.log('megaerror');
                        }
                    }
                    else {
                        if (touch.nx * (balls[touch.i].postForceX) +
                            touch.ny * (balls[touch.i].postForceY) < -1e-3) {
                            console.log('megaerror');
                        }
                    }
                }
            }
            for (i = 0; i < r.length; i++) {
                if (r[i] < 0) {
                    resolve = true;
                    log += 'result have negative value. ' + initialtouchings.indexOf(touchings[i]) + '\r\n';
                    break;
                }
            }
            if (!resolve) {
                for (i = 0; i < initialtouchings.length; i++) {
                    touch = initialtouchings[i];
                    if (touch.j > -1) {
                        if (touch.nx * (balls[touch.i].postForceX - balls[touch.j].postForceX) +
                            touch.ny * (balls[touch.i].postForceY - balls[touch.j].postForceY) > 0
                            && touchings.indexOf(touch) == -1) {
                            resolve = true;
                            log += 'result hasnt needed touching ' + i + '\n\r';
                            break;
                        }
                    }
                    else {
                        if (touch.nx * (balls[touch.i].postForceX) +
                            touch.ny * (balls[touch.i].postForceY) > 0
                            && touchings.indexOf(touch) == -1) {
                            resolve = true;
                            log += 'result hasnt needed touching ' + i + '\n\r';
                            break;
                        }
                    }
                }
            }
            if (resolve) {

                var t2 = [];
                for (i = 0; i < initialtouchings.length; i++) {
                    touch = initialtouchings[i];
                    if (touch.j > -1) {
                        if (touch.nx * (balls[touch.i].postForceX - balls[touch.j].postForceX) +
                            touch.ny * (balls[touch.i].postForceY - balls[touch.j].postForceY) > 0
                            && touchings.indexOf(touch) == -1) {
                            t2.push(touch);
                            log += 'add needed value. ' + i + '\r\n';
                        }
                    }
                    else {
                        if (touch.nx * (balls[touch.i].postForceX) +
                            touch.ny * (balls[touch.i].postForceY) > 0
                            && touchings.indexOf(touch) == -1) {
                            t2.push(touch);
                            log += 'add needed value. ' + i + '\r\n';
                        }
                    }
                }
                for (i = 0; i < r.length; i++) {
                    if (r[i] < 0) {
                        balls[touchings[i].i].postForceX = balls[touchings[i].i].preForceX;
                        gettouching(balls[touchings[i].i], touchings[i].j)[3] = 0;
                        if (touchings[i].j > -1) {
                            balls[touchings[i].j].postForceY = balls[touchings[i].j].preForceY;
                            gettouching(balls[touchings[i].j], touchings[i].i)[3] = 0;
                        }

                        log += 'remove negative value. ' + initialtouchings.indexOf(touchings[i]) + '\r\n';
                        touchings.splice(i, 1);
                        r.splice(i, 1);
                        i--;
                    }
                }
                for (i = 0; i < t2.length; i++) {
                    touchings.push(t2[i]);
                }
                log += '{'
                for (i = 0; i < touchings.length; i++) {
                    log += ', ' + initialtouchings.indexOf(touchings[i])
                }
                log += '}\r\n';
                r = this.solve2(balls, touchings);
                iter++;
                log += 'iter = ' + iter + '\r\n';
            }
            else {
                //console.log(log);
                //app.stoped=true;
                return;
            }

        } while (iter < 10);
        console.log(log);

        // clear all forces
        for (i = 0; i < balls.length; i++) {
            ball = balls[i];
            ball.postForceX = ball.preForceX;
            ball.postForceY = ball.preForceY;
        }
        for (i = 0; i < initialtouchings.length; i++) {
            touch = touchings[i];
            gettouching(balls[touch.i], touch.j)[3] = 0;
            if (touch.j > -1)
                gettouching(balls[touch.j], touch.i)[3] = 0;
        }
    },
    solve2: function (balls, touchings) {
        var touch, i, j;
        var A = [];
        var y = [];
        var ball1, ball2, touch2, td, d;
        for (i = 0; i < touchings.length; i++) {
            touch = touchings[i];
            A[i] = [];
            for (j = 0; j < touchings.length; j++) A[i][j] = 0;
            ball1 = balls[touch.i];
            for (j = 0; j < ball1.touchinngs.length; j++) {
                touch2 = this.findTouch(touchings, touch.i, ball1.touchinngs[j][2]);
                if (touch2 == null)continue;
                td = touchings.indexOf(touch2);
                d = (touch2.nx * touch.nx + touch2.ny * touch.ny) / ball1.mass;

                if (touch2.i == touch.i) {
                    A[i][td] += d;
                }
                else {
                    A[i][td] -= d;
                }
            }
            y[i] = (ball1.preForceX * touch.nx + ball1.preForceY * touch.ny) / ball1.mass;
            if (touch.j > 0) {
                ball2 = balls[touch.j];
                y[i] -= (ball2.preForceX * touch.nx + ball2.preForceY * touch.ny) / ball2.mass;
                for (j = 0; j < ball2.touchinngs.length; j++) {
                    touch2 = this.findTouch(touchings, touch.j, ball2.touchinngs[j][2]);
                    if (touch2 == null)continue;
                    td = touchings.indexOf(touch2);
                    d = (touch2.nx * touch.nx + touch2.ny * touch.ny) / ball2.mass;
                    if (touch2.i == touch.j) {
                        A[i][td] -= d;
                    }
                    else {
                        A[i][td] += d;
                    }
                }
            }
        }
        var r = LinAlgebra.SLARSolver(A, y);
        var ball, touchs;
        for (i = 0; i < touchings.length; i++) {
            touch = touchings[i];
            gettouching(balls[touch.i], touch.j)[3] = r[i];
            if (touch.j > -1)
                gettouching(balls[touch.j], touch.i)[3] = r[i];
        }
        for (i = 0; i < balls.length; i++) {
            ball = balls[i];
            touchs = ball.touchinngs;
            ball.postForceX = ball.preForceX;
            ball.postForceY = ball.preForceY;
            for (j = 0; j < touchs.length; j++) {
                touch = touchs[j];
                ball.postForceX -= touch[0] * touch[3];
                ball.postForceY -= touch[1] * touch[3];
            }
        }
        return r;
    },
    clear: function (balls) {
        for (var i = 0; i < balls.length; i++) {
            balls[i].postForceX = balls[i].preForceX;
            balls[i].postForceY = balls[i].preForceY;
            for (var j = 0; j < balls[i].touchinngs.length; j++) {
                balls[i].touchinngs[j][3] = 0;
            }
        }
    }
};

var Drawer = {
    drawArrow: function (context, x, y, nx, ny, length) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + nx * length, y + ny * length);
        context.closePath();
        context.stroke();
        var widthArrow = 3;
        var lengthArrow = 10;
        if (length < 0) {
            widthArrow = -3;
            lengthArrow = -10;
        }
        if (Math.abs(length) < Math.abs(lengthArrow)) {
            lengthArrow = length * .9;
            widthArrow = length * .3;
        }
        context.beginPath();
        context.moveTo(x + nx * length, y + ny * length);
        context.lineTo(x + nx * length - lengthArrow * nx - ny * widthArrow, y + ny * length - lengthArrow * ny + nx * widthArrow);
        context.closePath();
        context.stroke();
        context.beginPath();
        context.moveTo(x + nx * length, y + ny * length);
        context.lineTo(x + nx * length - lengthArrow * nx + ny * widthArrow, y + ny * length - lengthArrow * ny - nx * widthArrow);
        context.closePath();
        context.stroke();
    },
    drawBalls: function (context, balls) {
        var ball, touch, nx, ny, length;
        context.globalAlpha = 0.5;
        var i, k;

        context.lineWidth = 1;

        for (i = 0; i < balls.length; i++) {
            ball = balls[i];
            // коло
            context.fillStyle = ball.fillStyle;
            context.strokeStyle = ball.strokeStyle;

            context.beginPath();
            context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
            context.closePath();
            context.fill();
            context.stroke();
        }

        context.lineWidth = 3;
        for (i = 0; i < balls.length; i++) {
            ball = balls[i];
            // preForce
            length = Math.sqrt(ball.preForceX * ball.preForceX + ball.preForceY * ball.preForceY);
            if (length > 0) {
                nx = ball.preForceX / length;
                ny = ball.preForceY / length;
                context.strokeStyle = '#F00';
                Drawer.drawArrow(context, ball.x, ball.y, nx, ny, length);
            }
            // postForce
            length = Math.sqrt(ball.postForceX * ball.postForceX + ball.postForceY * ball.postForceY);
            if (length > 0) {
                nx = ball.postForceX / length;
                ny = ball.postForceY / length;
                context.strokeStyle = '#0FF';
                Drawer.drawArrow(context, ball.x, ball.y, nx, ny, length);
            }
        }

        context.lineWidth = 3;
        context.strokeStyle = '#0FF';
        context.fillStyle = "#FF0";
        for (i = 0; i < balls.length; i++) {
            ball = balls[i];
            // touchinngs
            for (k = 0; k < ball.touchinngs.length; k++) {
                touch = ball.touchinngs[k];
                // N force
                Drawer.drawArrow(context, ball.x + ball.radius * touch[0], ball.y + ball.radius * touch[1], touch[0], touch[1], touch[3]);
            }
        }

        context.lineWidth = 2;
        context.fillStyle = "#FFF";
        context.strokeStyle = '#000';
        for (i = 0; i < balls.length; i++) {
            ball = balls[i];
            // center point
            context.beginPath();
            context.arc(ball.x, ball.y, 4, 0, Math.PI * 2, true);
            context.closePath();
            context.fill();
            context.stroke();
            // touchinngs
            for (k = 0; k < ball.touchinngs.length; k++) {
                touch = ball.touchinngs[k];
                // touching point
                context.beginPath();
                context.arc(ball.x + ball.radius * touch[0], ball.y + ball.radius * touch[1], 4, 0, Math.PI * 2, true);
                context.closePath();
                context.fill();
                context.stroke();
            }
        }

        context.lineWidth = 4;
        context.fillStyle = "rgba(255,0,0,.5)";
        context.strokeStyle = 'rgba(255,0,0,1)';
        for (i = 0; i < balls.length; i++) {
            ball = balls[i];
            // preForce target hover
            context.beginPath();
            context.arc(ball.x + ball.preForceX , ball.y + ball.preForceY, 15, 0, Math.PI * 2, true);
            context.closePath();
            //context.fill();
            context.stroke();
        }
    },
    onMouseDownPositiontest: function (balls, posx, posy) {
        var ball, i, dx, dy, mousemoveevent;
        for (i = balls.length - 1; i >= 0; i--) {
            ball = balls[i];

            // preForce
            if (length(ball.preForceX + ball.x, ball.preForceY + ball.y, posx, posy) < 18) {
                dx = ball.preForceX - posx;
                dy = ball.preForceY - posy;
                mousemoveevent = function (newx, newy) {
                    if (length(0, 0, dx + newx, dy + newy) < 20) {
                        ball.preForceX = 0;
                        ball.preForceY = 0;
                    }
                    ball.preForceX = dx + newx;
                    ball.preForceY = dy + newy;
                };
                return mousemoveevent;
            }
        }
        for (i = balls.length - 1; i >= 0; i--) {
            ball = balls[i];
            if (length(ball.x, ball.y, posx, posy) < ball.radius) {
                dx = ball.x - posx;
                dy = ball.y - posy;
                var index = i;
                mousemoveevent = function (newx, newy) {
                    ball.x = dx + newx;
                    ball.y = dy + newy;
                    var res = IntersectionsHelper.hardfindclosestpoints(ball, balls);
                    for (var k = 0; k < ball.touchinngs.length; k++) {
                        balls[ball.touchinngs[k][2]].postForceX = 0;
                        balls[ball.touchinngs[k][2]].postForceY = 0;
                        removetouching(balls[ball.touchinngs[k][2]], index);
                    }
                    ball.touchinngs = [];
                    if (res != null) {
                        var n, tdx, tdy, d;
                        for (var i = 0; i < res.length; i++) {
                            n = res[i];
                            if (n[3] == -1) {
                                ball.x = n[0];
                                ball.y = n[1];
                                tdx = balls[n[2]].x - ball.x;
                                tdy = balls[n[2]].y - ball.y;
                                d = Math.sqrt(tdx * tdx + tdy * tdy);
                                settouching(ball, tdx / d, tdy / d, n[2]);
                                settouching(balls[n[2]], -tdx / d, -tdy / d, index);
                            }
                            else {
                                ball.x = n[0];
                                ball.y = n[1];
                                tdx = balls[n[2]].x - ball.x;
                                tdy = balls[n[2]].y - ball.y;
                                d = Math.sqrt(tdx * tdx + tdy * tdy);
                                settouching(ball, tdx / d, tdy / d, n[2]);
                                settouching(balls[n[2]], -tdx / d, -tdy / d, index);
                                tdx = balls[n[3]].x - ball.x;
                                tdy = balls[n[3]].y - ball.y;
                                d = Math.sqrt(tdx * tdx + tdy * tdy);
                                settouching(ball, tdx / d, tdy / d, n[3]);
                                settouching(balls[n[3]], -tdx / d, -tdy / d, index);
                            }
                        }
                    }
                };
                return mousemoveevent;
            }
        }
        return null;
    }
};

function length(x0, y0, x, y) {
    var dx = x0 - x;
    var dy = y0 - y;
    return Math.sqrt(dx * dx + dy * dy);
}
function settouching(ball, nx, ny, index) {
    for (var i = 0; i < ball.touchinngs.length; i++) {
        if (ball.touchinngs[i][2] == index) {
            ball.touchinngs[i][0] = nx;
            ball.touchinngs[i][1] = ny;
            return;
        }
    }
    ball.touchinngs.push([nx, ny, index, 0]);
}
function gettouching(ball, index) {
    for (var i = 0; i < ball.touchinngs.length; i++) {
        if (ball.touchinngs[i][2] == index) {
            return ball.touchinngs[i];
        }
    }
    return null;
}
function removetouching(ball, index) {
    for (var i = 0; i < ball.touchinngs.length; i++) {
        if (ball.touchinngs[i][2] == index) {
            ball.touchinngs.splice(i, 1);
            return;
        }
    }
}

var getLocalPosition = function (e) {
    var posx = 0;
    var posy = 0;
    if (!e) e = window.event;
    if (e.offsetX || e.offsetY) {
        posx = e.offsetX;
        posy = e.offsetY;
    }
    else if (e.layerX || e.layerY) {
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
    return [posx, posy];
};

var Ball = function (config) {
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius;
    this.mass = config.mass;
    this.fillStyle = config.color;
    this.strokeStyle = '#000';
    this.preForceX = 0;
    this.preForceY = 0;
    this.postForceX = 0;
    this.postForceY = 0;
    this.touchinngs = [];
};

var SolverForcesApp = function (canvas) {
    var g = this;
    this.balls = [
        new Ball({x: 100, y: 100, radius: 40, mass: 100, color: '#9ae'}),
        new Ball({x: 100, y: 190, radius: 40, mass: 100, color: '#9ae'}),
        new Ball({x: 210, y: 100, radius: 60, mass: 100, color: '#a56'}),
        new Ball({x: 210, y: 230, radius: 60, mass: 100, color: '#a56'}),
        new Ball({x: 360, y: 100, radius: 80, mass: 100, color: '#f56'}),
        new Ball({x: 360, y: 270, radius: 80, mass: 100, color: '#f56'}),
        new Ball({x: 550, y: 100, radius: 100, mass: 100, color: '#560'}),
        new Ball({x: 550, y: 310, radius: 100, mass: 100, color: '#560'}),
        new Ball({x: 200, y: 420, radius: 120, mass: 100, color: '#060'})
    ];
    this.canvas = canvas;
    this.mousemoveevent = null;
    this.ctx = this.canvas.getContext("2d");
    this.changed = true;
    setInterval(function () {
        if (g.changed) {
            g.changed = false;
            g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
            ForsesSolver.clear(g.balls);
            ForsesSolver.metaSolve2(g.balls);
            Drawer.drawBalls(g.ctx, g.balls);
        }
    }, 50);
    this.canvas.addEventListener("mousemove", function (e) {
        var pos = getLocalPosition(e);
        if (g.mousemoveevent != null) {
            g.changed = true;
            g.mousemoveevent(pos[0], pos[1]);
        }
    }, false);
    this.canvas.addEventListener("mousedown", function (e) {
        var pos = getLocalPosition(e);
        g.mousemoveevent = Drawer.onMouseDownPositiontest(g.balls, pos[0], pos[1]);
        e.preventDefault();
    }, false);
    this.canvas.addEventListener("mouseup", function (e) {
        g.mousemoveevent = null;
        e.preventDefault();
    }, false);
};
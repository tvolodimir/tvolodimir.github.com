/**
 *  @overview $simpleModuleManager like RequireJS but more simple:)
 *  - get loaded module by module's name
 *  - load module :
 *       - only once invoke factory of each modules
 *       - check if requires modules already loaded
 **/
if (typeof scope.$simpleModuleManager === 'undefined') {

    var module = {};
    module.loaded = {};
    module.defines = {};
    module.getModule = function (name) {
        var m = module.loaded[name];
        if (m !== undefined) {
            return m;
        }
        else {
            // search in-depth
            var stack = [name];
            var backStack = [];
            while (stack.length > 0) {
                var n = stack.pop();
                if (module.loaded[n] === undefined) {
                    backStack.push(n);
                    var d = module.defines[n];
                    if (d !== undefined) {
                        var exdep = false;
                        stack.push(n);
                        for (var i = 0; i < d.requires.length; i++) {
                            var r = d.requires[i];
                            if (module.loaded[r] === undefined) {
                                if (backStack.indexOf(r) > -1) {
                                    throw new Error('circular dependency %s', d.requires[i]);
                                }
                                stack.push(r);
                                exdep = true;
                            }
                        }
                        if (exdep === false) {
                            module.invoke(d.name, d.requires, d.factory, d.exports);
                            stack.pop();
                        }

                    }
                    else {
                        console.error('module %s not defined', n);
                    }
                }
            }
            return  module.loaded[name];
        }
    };
    module.defineLazy = function (name, requires, factory, exports) {
        module.defines[name] = {
            name: name,
            requires: requires,
            factory: factory,
            exports: exports
        };
    };
    module.invoke = function (name, requires, factory, exports) {
        if (module.loaded[name]) {
            console.log('[mm] module ' + name + ' already loaded');
            return false;
        }
        var r = [];
        for (var i = 0; i < requires.length; i++) {
            var m = module.loaded[requires[i]];
            if (!m) {
                throw new Error('module ' + name + ' require ' + requires[i]);
            }
            else {
                r.push(m);
            }
        }

        r.unshift(module.loaded[name] = {}, module.getModule);

        (function () {
            console.log('[mm] loading ' + name);
            try {
                factory.apply(this, r);
            }
            catch (error) {
                console.error('[mm]', error['arguments'], error['stack']);
            }
        })();

        if (typeof exports !== 'undefined') {
            exports[name] = module.loaded[name];
        }

        return true;
    };

    scope.$simpleModuleManager = {
        invoke: module.invoke,
        defineLazy: module.defineLazy,
        getModule: module.getModule
    };
}
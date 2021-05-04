const JestRuntime = require('jest-runtime');

function removeRootDirectory(roots, path) {
    // to get valid amd module name
    for (let index = 0; index < roots.length; ++index) {
        if (path.startsWith(roots[index])) {
            return path.slice(roots[index].length + 1).replace(/\.js$/, '');
        }
    }
    return path;
}

function installGlobalVariables(environment) {
    global.describe = environment.global.describe;
    global.it = environment.global.it;
    global.before = environment.global.beforeAll;
    global.after = environment.global.afterAll;
    global.beforeEach = environment.global.beforeEach;
    global.afterEach = environment.global.afterEach;
    global.assert = environment.global.assert;
    global.wsConfig = environment.global.wsConfig;
}

class Runtime extends JestRuntime {
    constructor(config, environment, resolver, cacheFS, coverageOptions, testPath) {
        super(config, environment, resolver, cacheFS, coverageOptions, testPath);

        const uiModule = removeRootDirectory(config.roots, testPath);
        const originRequireModule = this.requireModule;
        this.requireModule = function(path) {
            if (path !== testPath) {
                return originRequireModule.apply(this, arguments);
            }
            return new Promise(function(resolve, reject) {
                installGlobalVariables(environment);
                environment.global.requirejs([uiModule], function() {
                    resolve();
                }, function eb(error) {
                    reject(error);
                });
            });
        };
    }
}


module.exports = Runtime;
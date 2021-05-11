const JestRuntime = require('jest-runtime');

function removeRootDirectory(rootDir, path) {
    // to get valid amd module name
    if (path.startsWith(rootDir)) {
        return path.slice(rootDir.length + 1).replace(/\.js$/, '');
    }
    return path.replace(/\.js$/, '');
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
    global.sinon = environment.global.sinon;
}

class Runtime extends JestRuntime {
    constructor(config, environment, resolver, cacheFS, coverageOptions, testPath) {
        super(config, environment, resolver, cacheFS, coverageOptions, testPath);

        const uiModule = removeRootDirectory(config.rootDir, testPath);
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

const JestRuntime = require('jest-runtime');
const SabyEnvironment = require('./env-saby');

class Runtime extends JestRuntime {
   constructor(config, environment, resolver, cacheFS, coverageOptions, testPath) {
      super(config, environment, resolver, cacheFS, coverageOptions, testPath);

      const uiModule = SabyEnvironment.prepareUIModulePath(config, testPath);
      const originRequireModule = this.requireModule;
      this.requireModule = function(path) {
         if (path !== testPath) {
            return originRequireModule.apply(this, arguments);
         }
         return new Promise(function(resolve, reject) {
            SabyEnvironment.installGlobals(environment);
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

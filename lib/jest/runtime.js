const JestRuntime = require('jest-runtime');
const path = require('path');
const vm = require('vm');

function removeFileExtension(path) {
   return path.slice(0, path.lastIndexOf('.'));
}

function findUIModulePath(roots, fullPath) {
   for (let index = 0; index < roots.length; ++index) {
      const root = roots[index];
      if (!fullPath.startsWith(root)) {
         continue;
      }
      const startIndex = root.lastIndexOf(path.sep);
      return removeFileExtension(fullPath.slice(startIndex + 1));
   }
}

function prepareUIModulePath(config, fullPath) {
   const testModule = findUIModulePath(config.roots, fullPath);
   if (testModule) {
      return testModule;
   }
   const uiModule = findUIModulePath(config.moduleDirectories, fullPath);
   if (uiModule) {
      return uiModule;
   }
   return fullPath;
}

class Runtime extends JestRuntime {
   constructor(config, environment, resolver, cacheFS, coverageOptions, testPath) {
      super(config, environment, resolver, cacheFS, coverageOptions, testPath);
      const unixPath = testPath.split(path.sep).join(path.posix.sep);

      this._uiModule = prepareUIModulePath(config, unixPath);
      this._testPath = testPath;
   }

   requireModule(from, moduleName, options, isRequireActual) {
      if (from !== this._testPath) {
         return super.requireModule(from, moduleName, options, isRequireActual);
      }
      return this.requireSabyTestModule();
   }

   requireSabyTestModule(testPath) {
      const scriptSource = `
         (function() {
            return new Promise(function(resolve, reject) {
               requirejs(['${this._uiModule}'], function() {
                  resolve();
               }, function(error) {
                  reject(error);
               })
            });
         })();
         `;
      const script = new vm.Script(scriptSource, {
         filename: this._testPath
      });
      return this._environment.runScript(script);
   }
}

module.exports = Runtime;

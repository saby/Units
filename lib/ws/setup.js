/**
 * Setups RequireJS for WS
 */

let fs = require('fs');

function setupRequireJs(requirejs, configPath, projectRootPath, dependencies, wsRootPath, contents) {
   let config = {};
   const CONFIG_EXISTS = fs.existsSync(configPath);

   if (CONFIG_EXISTS) {
      config = require(configPath)(
         projectRootPath,
         wsRootPath,
         '',
         contents
      );
   }

   config.nodeRequire = require;

   requirejs.config(config);

   if (dependencies) {
      dependencies.forEach((name) => {
         requirejs(name);
      });
   }
}

exports.requireJs = setupRequireJs;

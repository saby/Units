/**
 * Setups RequireJS for WS
 */

let fs = require('fs');

function setupRequireJs(requirejs, configPath, projectRootPath, dependencies, wsRootPath, contents) {
   const CONFIG_EXISTS = fs.existsSync(configPath);

   let config = {
      baseUrl: projectRootPath
   };
   if (CONFIG_EXISTS) {
      let config = require(configPath);
      config = typeof config === 'function' ? config(
         projectRootPath,
         wsRootPath,
         '',
         contents
      ) : config;
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

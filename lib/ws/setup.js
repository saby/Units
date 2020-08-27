/**
 * Setups RequireJS for WS
 */

const fs = require('fs');
const logger = console;

function setupRequireJs(requirejs, configPath, projectRootPath, dependencies, wsRootPath, contents) {
   const CONFIG_EXISTS = fs.existsSync(configPath);
   let config = {
      baseUrl: projectRootPath
   };
   if (CONFIG_EXISTS) {
      let configCreate = require(configPath);
      config = typeof configCreate === 'function' ? configCreate(
         projectRootPath,
         wsRootPath,
         '',
         contents
      ) : configCreate;
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

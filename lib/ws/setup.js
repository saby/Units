/**
 * Setups RequireJS for WS
 */
function setupRequireJs(requirejs, configPath, projectRootPath, wsRootPath, resourcesPath, contents) {
   let config = require(configPath)(
      projectRootPath,
      wsRootPath,
      resourcesPath,
      contents
   );
   config.nodeRequire = require;

   requirejs.config(config);
}

exports.requireJs = setupRequireJs;

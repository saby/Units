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

/**
 * Setups jsModules section URLs loaded from contents.json
 */
function setupJsModules(contents, requirejs, resourcesPath) {
   if (contents && contents.jsModules) {
      let constants = requirejs('Core/constants');
      constants.jsModules = constants.jsModules || {};
      Object.keys(contents.jsModules).forEach(module => {
         let modulePath = path.join(
            resourcesPath,
            contents.jsModules[module]
         );
      constants.jsModules[module] = (resourcesPath ? '/' : '') + modulePath;
   });
   }
}

exports.jsModules = setupJsModules;

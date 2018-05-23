/**
 * Setups testing environment
 */
function prepareEnvironment(requirejs, wsRootPath, resourcesPath) {
   global.isMochaRunned = true;
   global.assert = require('chai').assert;
   global.sinon = require('sinon');
   global.requirejs = requirejs;
   global.define = requirejs.define;
   global.wsConfig = {
      wsRoot: wsRootPath,
      resourceRoot: resourcesPath
   };
}

module.exports = prepareEnvironment;

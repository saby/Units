/**
 * Setups testing environment
 */
function prepareEnvironment(requirejs, wsRootPath) {
   global.assert = require('chai').assert;
   global.sinon = require('sinon');
   global.jsdom = require('jsdom');
   global.requirejs = requirejs;
   global.define = requirejs.define;
   global.wsConfig = {
      wsRoot: wsRootPath,
      resourceRoot: ''
   };
}

module.exports = prepareEnvironment;

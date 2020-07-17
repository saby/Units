/**
 * Setups testing environment
 */
function prepareEnvironment(requirejs, wsConfig) {
   global.assert = require('chai').assert;
   global.sinon = require('sinon');
   global.jsdom = require('jsdom');
   global.requirejs = requirejs;
   global.define = requirejs.define;
   global.wsConfig = wsConfig;
}

module.exports = prepareEnvironment;

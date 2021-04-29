const logger = console;

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

   // Try to require tslib.js so it would be ready to use if needed
   try {
    const tsLibPath = require.resolve('saby-typescript/tslib');
    if (tsLibPath) {
      requirejs(tsLibPath);
    }
 } catch (err) {
   logger.log(`tslib hasn\'t found: ${err}`);
 }
}

module.exports = prepareEnvironment;

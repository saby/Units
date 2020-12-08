/**
 * Runs testing via Node.js
 * @param {Object} config Config
 * @param {String} [config.moduleType='esm'] Testing module type: 'esm' - ECMAScript Module, 'amd' - Asynchronous Module Definition
 * @param {String} [config.root=''] Path to the project root
 * @param {Array} [config.tests] Path to tests folder (relative to config.root)
 * @param {String} [config.reportFile=''] Path to report file
 */
exports.run = function(config) {
   config = config || {};
   config.moduleType = config.moduleType || 'esm';
   config.root = config.root || '';
   config.tests = (config.tests && config.tests.length) ? config.tests : [config.root];
   config.reportFile = config.reportFile || '';

   require('./lib/isolated').run(config);
};

import run from './lib/isolated.es';

/**
 * Runs testing via Node.js
 * @param {Object} config Config
 * @param {String} [config.moduleType='esm'] Testing module type: 'esm' - ECMAScript Module, 'amd' - Asynchronous Module Definition
 * @param {String} [config.ws=''] Path to WS core
 * @param {String} [config.resources=''] Path to resources folder
 * @param {Array} [config.tests] Path to tests folder (relative to config.resources)
 * @param {String} [config.reportFile=''] Path to report file
 */
export default function (config) {
   config = config || {};
   config.moduleType = config.moduleType || 'esm';
   config.root = config.root || '';
   config.ws = config.ws || '';
   config.resources = config.resources || '';
   config.tests = (config.tests && config.tests.length) ? config.tests : [config.resources];
   config.reportFile = config.reportFile || '';

   run(config);
};

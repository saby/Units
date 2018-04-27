#!/usr/bin/env node

/**
 * Runs testing via Node.js
 * @param {Object} config Config
 * @param {String} [config.ws=''] Path to WS core
 * @param {String} [config.resources=''] Path to resources folder
 * @param {String} [config.tests] Path to tests folder (relative to config.resources)
 * @param {String} [config.reportFile=''] Path to report file
 */
exports.run = function(config) {
   config = config || {};
   config.root = config.root || '';
   config.ws = config.ws || '';
   config.resources = config.resources || '';
   config.tests = config.tests || config.resources;
   config.reportFile = config.reportFile || '';

   require('./lib/isolated').run(config);
};

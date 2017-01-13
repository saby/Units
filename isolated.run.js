/**
 * Usage:
 * node isolated.run
 */
var config = require('./config');
require('./lib/isolated').run(config);
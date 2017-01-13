/**
 * Usage:
 * node coverage.run
 */
var config = require('./config');
config.saveToFile = false;
require('./lib/isolated').run(config);

process.on('exit', function(code) {
   code = process.exitCode = 0;
});

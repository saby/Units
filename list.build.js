/**
 * Usage:
 * node list.build path/to/tests
 */
var path = require('path'),
   config = require('./config');

require('./lib/unit').test.buildList(
   path.join(__dirname, 'list.js'),
   path.join(config.root, config.tests)
);
#!/usr/bin/env node
const util = require('../lib/util');
const app = require('../server');
const config = util.getConfig();

app.run(process.env['test_server_port'] || config.url.port, {
   moduleType: config.moduleType,
   root: config.root,
   tests: config.tests,
   initializer: config.initializer,
   coverageCommand: config.coverageCommand,
   coverageReport: config.htmlCoverageReport
});

#!/usr/bin/env node
const util = require('../lib/util');
const app = require('../isolated');
const config = util.getConfig();

let report = '';
if (process.argv.indexOf('--report') > -1) {
   report = process.env['test_report'] || config.report;
}

let emulatorBrowser = false;
if (process.argv.indexOf('--emulatorBrowser') > -1) {
   emulatorBrowser = true;
}

app.run({
   moduleType: config.moduleType,
   root: config.root,
   tests: config.tests,
   dependencies: config.dependencies,
   patchedRequire: config.patchedRequire,
   reportFile: report,
   emulatorBrowser: emulatorBrowser
});

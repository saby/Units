#!/usr/bin/env node
const util = require('../lib/util');
const app = require('../browser');
const config = util.getConfig();

let report = '';
if (process.argv.indexOf('--report') > -1) {
   report = process.env['test_report'] || config.report;
}

let coverageReport = '';
if (process.argv.indexOf('--coverage') > -1) {
   coverageReport = config.jsonCoverageReport;
}

let provider;
if (process.argv.indexOf('--selenium') > -1) {
   provider = 'selenium';
}

let head;
if (process.argv.indexOf('--head') > -1) {
   head = true;
}

function buildUrl(parts) {
   return parts.scheme + '://' + parts.host + ':' + parts.port + '/' + parts.path + '?' + parts.query;
}

app.run(
  'http://localhost:1025/?reporter=XUnit',
   report,
   coverageReport,
   provider,
   head
);

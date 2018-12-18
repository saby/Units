#!/usr/bin/env node
const util = require('../lib/util');
const app = require('../browser');
const config = util.getConfig();

let report = '';
if (process.argv.indexOf('--report') > -1) {
   report = process.env['test_report'] || config.report;
}

if (process.argv.indexOf('--coverage') > -1) {
   config.report = config.jsonCoverageReport;
   config.url.query = 'reporter=JSCoverage';
}

function buildUrl(parts) {
   return parts.scheme + '://' + parts.host + ':' + parts.port + '/' + parts.path + '?' + parts.query;
}

app.run(
   buildUrl({
      scheme: process.env['test_url_scheme'] || config.url.scheme,
      host: process.env['test_url_host'] || config.url.host,
      port: process.env['test_url_port'] || config.url.port,
      path: process.env['test_url_path'] || config.url.path,
      query: process.env['test_url_query'] || config.url.query
   }),
   report
);

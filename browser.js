/**
 * Runs testing via Webdriver
 * @param {String} url URL with testing
 * @param {String} [report=''] Path to report file that's will be created
 * @param {String} [coverageReport=''] Path to coverage report file
 */
exports.run = function(url, report, coverageReport, provider, head) {
   require('./lib/browser').run({
      url: url,
      reportFile: report,
      coverageReportFile: coverageReport,
      provider: provider,
      head: head
   });
};

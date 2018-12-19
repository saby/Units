/**
 * Runs testing via Webdriver
 * @param {String} url URL with testing
 * @param {String} [report=''] Path to report file that's will be created
 */
exports.run = function(url, report) {
   require('./lib/browser').run({
      url: url,
      reportFile: report
   });
};

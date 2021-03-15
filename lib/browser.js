/**
 * Runs unit tests via Selenium webdriver
 */

const fs = require('fs');
const path = require('path');
const Report = require('./unit').Report;
const Checker = require('./Checker');
const util = require('./util');
const logger = console;
const LOG_TAG = '[browser]';
const MAX_REPORT_LENGTH = 1024;

/**
 * Loads URL via webdriver
 * @param {Webdriver | Chrome} driver Webdriver instance
 * @param {String} url URL to load
 * @return {Promise}
 */
function loadUrl(driver, url) {
   logger.log(LOG_TAG, `Going to URL ${url}`);
   return driver.open(url).then(() => {
      logger.log(LOG_TAG, `URL ${url} loaded`);
   }).catch((err) => {
      logger.log(LOG_TAG, `Unable go to URL ${url} because: ${err}`);
      throw err;
   });
}

/**
 * Checks if testing page throws an Error
 * @param {Object} driver Driver instance to work with
 * @return {Promise}
 */
function checkTestingException(driver) {
   return new Promise((resolve, reject) => {
      // Проверяем исключения
      driver.querySelector('#exception').then((exception) => {
         logger.log(LOG_TAG, 'Check for exception');
         exception.isExisting().then((isExisting) => {
            logger.log(LOG_TAG, `Has exception: ${isExisting}`);
            if (!isExisting) {
               resolve(false);
               return;
            }

            logger.log(LOG_TAG, 'Web page throws an exception, getting text');
            exception.getText().then((text) => {
               reject(new Error('Web page has the exception: ' + text));
            }).catch(reject);
         }).catch(reject);
      }).catch(reject);
   });
}

/**
 * Runs testing on certain URL, returns testing report.
 */
class Loader {
   constructor(cfg) {
      const Provider = require(cfg.provider === 'selenium' ? './Webdriver' : './Chrome');

      this._provider = new Provider({
         headless: cfg.headless,
         port: cfg.driverPort
      });
   }

   get provider() {
      return this._provider;
   }

   /**
    * Runs testing on certain URL
    * @param {String} url URL with testing
    * @return {Promise}
    */
   async start(url) {
      const delay = t => new Promise(resolve => setTimeout(resolve, t));
      await this.provider.startUp();
      try {
         await loadUrl(this.provider, url);
         logger.log(LOG_TAG, `URL ${url} loaded`);
      } catch (err) {
         if (typeof err.includes === 'function' && err.includes('ERR_CONNECTION_REFUSED')) {
            await delay(500);
            logger.log(LOG_TAG, `Try go to URL ${url} another one`);
            await loadUrl(this.provider, url);
         } else {
            throw err;
         }
      }
   }

   /**
    * Stops testing
    * @return {Promise}
    */
   stop() {
      return this.provider.tearDown();
   }

   /**
    * Takes screenshot of the viewport
    * @param {String} fileName Store to given file name
    * @return {Promise}
    */
   getScreenshot(fileName) {
      return new Promise((resolve, reject) => {
         const filePath = path.dirname(fileName);

         if (!fs.existsSync(filePath)) {
            util.fs.mkdir(filePath);
         }

         logger.log(LOG_TAG, `Taking screenshot into "${fileName}"`);
         this.provider.saveScreenshot(fileName).then(() => {
            logger.log(LOG_TAG, 'Screenshot has been taken');
            resolve(fileName);
         }).catch(reject);
      });
   }

   /**
    * Returns report with testing result
    * @return {Promise}
    */
   getReport() {
      return new Promise((resolve, reject) => {
         const driver = this.provider;
         const checker = new Checker(driver);

         checker.start(() => Promise.all([
            this.checkTestingFinished(driver),
            checkTestingException(driver)
         ])).then(() => {
            resolve(this.text);
         }).catch(reject);
      });
   }

   /**
    * Returns coverage report
    * @return {Promise}
    */
   getCoverageReport() {
      return new Promise((resolve, reject) => {
         logger.log(LOG_TAG, 'Retrieving coverage report');

         this.provider.querySelector('#coverageReport').then((report) => {
            report.getValue(false).then((text) => {
               logger.log(LOG_TAG, 'Coverage report retrieved');
               resolve(text);
            }).catch(reject);
         }).catch(reject);
      });
   }

   /**
    * Checks if testing finished
    * @return {Promise}
    */
   checkTestingFinished(driver) {
      return new Promise((resolve, reject) => {
         // Ждем завершения тестов
         logger.log(LOG_TAG, 'Check testing is done');
         driver.querySelector('body.tests-finished').then((selector) => {
            selector.isExisting().then((isExisting) => {
               logger.log(LOG_TAG, `Testing done: ${isExisting}`);
               if (!isExisting) {
                  resolve(false);
                  return;
               }

               logger.log(LOG_TAG, 'Retrieving report');
               driver.querySelector('#report').then((report) => {
                  report.getValue(false).then((text) => {
                     logger.log(LOG_TAG, `Report of ${text.length} bytes retrieved`);
                     this.text = text;
                     resolve(true);
                  }).catch(reject);
               }).catch(reject);
            }).catch(reject);
         }).catch(reject);
      });
   }
}

exports.Loader = Loader;

/**
 * Run testing via Selenium
 * @param {Object} config Testing config
 */
exports.run = function(config) {
   let report;
   if (config.reportFile) {
      report = new Report(config.reportFile);

      // Remove old report
      report.clear();
   }

   // Create testing loader
   let loader = new Loader({
      provider: config.provider,
      headless: !config.head,
      driverPort: config.driverPort
   });

   // Create error handler
   let stopInProgress = false;
   let stopOnError = (tag) => (err) => {
      logger.error(`${LOG_TAG} ${tag}`, 'An error occurred:', err);
      process.exitCode = 1;

      if (stopInProgress) {
         throw err;
      }
      stopInProgress = true;

      logger.log(`${LOG_TAG} ${tag}`, 'Stopping loader');
      loader.stop().then(() => {
         logger.log(`${LOG_TAG} ${tag}`, 'Loader stopped');
      }).catch((stopErr) => {
         logger.error(`${LOG_TAG} ${tag}`, `Loader threw during stop: ${stopErr}`);
      });
   };

   process.on('uncaughtException', stopOnError('process.on(uncaughtException)'));

   // Run testing
   logger.log(LOG_TAG, 'Starting loader');
   loader.start(config.url).then(() => {
      // Loading report
      loader.getReport().then((reportText) => {
         var stop = function() {
            logger.log(LOG_TAG, 'Stopping loader');
            loader.stop().catch(stopOnError('loader.stop()'));
         };

         // Logging report
         logger.log(LOG_TAG, 'Here is the part of report contents below');
         logger.log(String(reportText).slice(0, MAX_REPORT_LENGTH) + '...');

         // Save report to the specified file
         if (report) {
            report.save(reportText);
         }

         if (config.coverageReportFile) {
            loader.getCoverageReport().then((coverageReportText) => {
               let coverageReport = new Report(config.coverageReportFile);
               coverageReport.clear();
               coverageReport.save(coverageReportText);

               stop();
            }).catch(stopOnError('loader.getCoverageReport()'));
         } else {
            stop();
         }
      }).catch((err) => {
         const screenshotFile = config.reportFile.replace('.xml', '') + '.png';
         loader.getScreenshot(screenshotFile).then(() => {
            stopOnError('loader.getReport()')(err);
         }).catch(stopOnError('loader.getScreenshot()'));
      });
   }).catch(stopOnError('loader.start()'));
};

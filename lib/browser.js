/**
 * Runs unit tests via Selenium webdriver
 */

const fs = require('fs');
const path = require('path');
const Provider = require('./webdriver').Provider;
const Checker = require('./webdriver').Checker;
const Report = require('./unit').Report;
const logger = console;
const LOG_TAG = '[browser]';
const MAX_REPORT_LENGTH = 1024;

/**
 * Loads URL via webdriver
 * @param {Provider} driver Webdriver instance
 * @param {String} url URL to load
 * @return {Promise}
 */
function loadUrl(driver, url) {
   logger.log(LOG_TAG, `Going to URL ${url}`);
   return driver.url(url).then(() => {
      logger.log(LOG_TAG, `URL ${url} loaded`);
   }).catch(err => {
      logger.log(LOG_TAG, `Unable go to URL ${url} because: ${err}`);
   });
}

/**
 * Runs testing on certain URL, returns testing report.
 */
class Loader {
   constructor() {
      this._provider = new Provider();
   }

   get provider() {
      return this._provider;
   }

   /**
    * Runs testing on certain URL
    * @param {String} url URL with testing
    * @return {Promise}
    */
   start(url) {
      return new Promise((resolve, reject) => {
         this.provider.startUp().then(() => {
            loadUrl(this.provider.driver, url).then(resolve).catch(reject);
         }).catch(reject);
      });
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
         let driver = this.provider.driver;
         const filePath = path.dirname(fileName);

         if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath);
         }

         logger.log(LOG_TAG, `Taking screenshot into "${fileName}"`);
         driver.saveScreenshot(fileName).then(() => {
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
         let driver = this.provider.driver;

         let checker = new Checker(driver);

         checker.start(() => {
            return Promise.all([
               this.checkTestingFinished(driver),
               this.checkTestingException(driver)
            ]);
         }).then(() => {
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
         let driver = this.provider.driver;

         logger.log(LOG_TAG, 'Retrieving coverage report');
         driver.$('#coverageReport').then((report) => {
            report.getValue(false).then(text => {
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
         //Ждем завершения тестов
         logger.log(LOG_TAG, 'Check testing is done');
         driver.$('body.tests-finished').then((selector) => {
            selector.isExisting().then(isExisting => {
               logger.log(LOG_TAG, `Testing done: ${isExisting}`);
               if (!isExisting) {
                  return resolve(false);
               }

               logger.log(LOG_TAG, 'Retrieving report');
               driver.$('#report').then((report) => {
                  report.getValue(false).then(text => {
                     logger.log(LOG_TAG, `Report of ${text.length} bytes retrieved`);
                     this.text = text;
                     resolve(true);
                  }).catch(reject);
               }).catch(reject);
            }).catch(reject);
         }).catch(reject);
      });
   }

   /**
    * Checks if testing throws an Error
    * @return {Promise}
    */
   checkTestingException(driver) {
      return new Promise((resolve, reject) => {
         //Проверяем исключения
         driver.$('#exception').then((exception) => {
            logger.log(LOG_TAG, 'Check for exception');
            exception.isExisting().then(isExisting => {
               logger.log(LOG_TAG, `Has exception: ${isExisting}`);
               if (!isExisting) {
                  return resolve(false);
               }

               logger.log(LOG_TAG, 'Web page throws an exception, getting text');
               exception.getText().then(text => {
                  reject('Web page has the exception: ' + text);
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

   //Create testing loader
   let loader = new Loader();

   //Create error handler
   let stopInProgress = false;
   let stopOnError = tag => err => {
      logger.error(`${LOG_TAG} ${tag}`,  'An error occurred:', err);
      process.exitCode = 1;

      if (stopInProgress) {
         throw err;
      }
      stopInProgress = true;

      logger.log(`${LOG_TAG} ${tag}`, 'Stopping loader');
      loader.stop().then(() => {
         logger.log(`${LOG_TAG} ${tag}`, 'Loader stopped');
      }).catch((err) => {
         logger.error(`${LOG_TAG} ${tag}`, `Loader threw during stop: ${err}`);
      });
   };

   process.on('uncaughtException', stopOnError('process.on(uncaughtException)'));

   //Run testing
   logger.log(LOG_TAG, 'Starting loader');
   loader.start(config.url).then(() => {
      //Loading report
      loader.getReport().then(reportText => {
         var stop = function() {
            logger.log(LOG_TAG, 'Stopping loader');
            loader.stop().catch(stopOnError('loader.stop()'));
         };

         //Logging report
         logger.log(LOG_TAG, 'Here is the part of report contents below');
         logger.log(String(reportText).slice(0, MAX_REPORT_LENGTH) + '...');

         //Save report to the specified file
         if (report) {
            report.save(reportText);
         }

         if (config.coverageReportFile) {
            loader.getCoverageReport().then(coverageReportText => {
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

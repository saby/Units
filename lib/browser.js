/**
 * Runs unit tests via Selenium webdriver
 */

let Provider = require('./webdriver').Provider,
   Checker = require('./webdriver').Checker,
   config = require('../etc/browser.json'),
   fromEnv = require('./util').fromEnv,
   reporter = require('./unit').report;

const logger = console;

fromEnv(config, 'BROWSER');

/**
 * Loads URL via webdriver
 * @param {Provider} driver Webdriver instance
 * @param {String} url URL to load
 * @return {Promise}
 */
function loadUrl(driver, url) {
   logger.log(`browser: Going to URL ${url}`);
   return driver.url(url).then(() => {
      logger.log(`browser: URL ${url} loaded`);
   }).catch(err => {
      logger.log(`browser: Unable go to URL ${url} because: ${err}`);
   });
}

/**
 * Runs testing on certain URL, returns testing report.
 */
class Loader extends Object {
   constructor() {
      super();
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
    * Returns report with testing result
    * @return {Promise}
    */
   getReport() {
      return new Promise((resolve, reject) => {
         let driver = this.provider.driver;

         let checker = new Checker(driver, {
            timeout: config.checkerTimeout
         });

         checker.start(() => {
            return Promise.all([
               this.checkTestingFinished(driver),
               this.checkTestingException(driver)
            ]);
         }).then(() => {
            resolve(this.text);
         }).catch(err => {
            reject(err);
         });
      });
   }

   /**
    * Checks if testing finished
    * @return {Promise}
    */
   checkTestingFinished(driver) {
      return new Promise((resolve, reject) => {
         //Ждем завершения тестов
         driver.isExisting('body.tests-finished', (err, isExisting) => {
            logger.log(`browser: Check testing done - ${isExisting}`);
            if (err) {
               return reject(err);
            }
            if (!isExisting) {
               return resolve(true);
            }

            logger.log('browser: Retrieving report');
            driver.getValue('#report', false, (err, text) => {
               if (err) {
                  return reject(err);
               }
               logger.log('browser: Report retrieved');
               this.text = text;
               resolve(false);
            });
         });
      });
   }

   /**
    * Checks if testing throws an Error
    * @return {Promise}
    */
   checkTestingException(driver) {
      return new Promise((resolve, reject) => {
         //Проверяем исключения
         driver.isExisting('#exception', (err, isExisting) => {
            logger.log(`browser: Checking for exception: ${isExisting}`);
            if (err) {
               return reject(err);
            }
            if (!isExisting) {
               return resolve(true);
            }

            logger.log('browser: Web page throws an exception, getting text');
            driver.getText('#exception').then(text => {
               reject('Web page error: ' + text);
            }).catch(reject);
         });
      });
   }
}

exports.Loader = Loader;

/**
 * Run testing via Selenium
 * @param {Object} config Testing config
 */
exports.run = function(config) {
   if (config.reportFile) {
      reporter.setFileName(config.reportFile);

      //Remove old report
      reporter.clear();
   }

   //Create testing loader
   let loader = new Loader();

   //Create error handler
   let stopInProgress = false;
   let stopOnError = tag => err => {
      logger.error(`browser: ${tag}: An error occurred: ${err}`);
      if (stopInProgress) {
         throw err;
      }
      stopInProgress = true;
      logger.log(`browser: ${tag}: Stopping loader because: ${err}`);
      loader.stop().then(() => {
         logger.log(`browser: ${tag}: Loader stopped`);
      }).catch((err) => {
         logger.error(`browser: ${tag}: Loader threw during stop: ${err}`);
      });
   };

   process.on('uncaughtException', stopOnError('process exception'));

   //Run testing
   logger.log('browser: Starting loader');
   loader.start(config.url).then(() => {
      //Loading report
      loader.getReport().then(report => {
         //Logging report
         logger.log(report);

         //Stop
         logger.log('browser: Stopping loader');
         loader.stop().catch(stopOnError('loader stop'));

         //Save report to the specified file
         if (config.reportFile) {
            reporter.save(report);
         }
      }).catch(stopOnError('get report'));
   }).catch(stopOnError('loader start'));
};

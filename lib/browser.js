/**
 * Прогоняет unit тесты в среде Selenium webdriver.
 */

let Provider = require('./webdriver').Provider,
   Checker = require('./webdriver').Checker,
   config = require('../etc/browser.json'),
   fromEnv = require('./util').fromEnv,
   reporter = require('./unit').report;

const logger = console;

fromEnv(config, 'BROWSER');

/**
 * Загружает URL через webdriver, получает отчет
 * @param {Provider} driver Драйвер
 * @param {String} url URL
 * @return {Promise}
 */
function loadUrl(driver, url) {
   logger.log('loader: going to URL ' + url);
   return driver.url(url).then(() => {
      logger.log('loader: URL ' + url + ' loaded');
   }).catch(err => {
      logger.log('loader: unable go to URL ' + url + ': ' + err);
   });
}

/**
 * Запускает тестирование через webdriver, возвращает отчет.
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
    * Запускает loader
    * @param {String} url URL страницы с тестами
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
    * Останавливает loader
    * @return {Promise}
    */
   stop() {
      return this.provider.tearDown();
   }

   /**
    * Возвращает отчет о прохождении тестов
    * @return {Promise}
    */
   getReport() {
      return new Promise((resolve, reject) => {
         let driver = this.provider.driver;

         let checker = new Checker(driver, {
            timeout: config.checkerTimeout
         });

         checker.start(() => {
            logger.log('loader: checkTestingFinished and checkTestingException');
            return Promise.all([
               this.checkTestingFinished(driver),
               this.checkTestingException(driver)
            ]);
         }).then(() => {
            resolve(this.text);
         }).catch(err => {
            logger.log('Checker rejected ' + err);
            reject(err);
         });
      });
   }

   checkTestingFinished(driver) {
      return new Promise((resolve, reject) => {
         //Ждем завершения тестов
         driver.isExisting('body.tests-finished', (err, isExisting) => {
            logger.log('loader: check testing done - ' + isExisting);
            if (err) {
               return reject(err);
            }
            if (!isExisting) {
               return resolve(true);
            }

            logger.log('loader: retrieving report');
            driver.getValue('#report', false, (err, text) => {
               if (err) {
                  return reject(err);
               }
               logger.log('loader: report retrieved');
               this.text = text;
               resolve(false);
            });
         });
      });
   }

   checkTestingException(driver) {
      return new Promise((resolve, reject) => {
         //Проверяем исключения
         driver.isExisting('#exception', (err, isExisting) => {
            logger.log('loader: check exception - ' + isExisting);
            if (err) {
               return reject(err);
            }
            if (!isExisting) {
               return resolve(true);
            }

            logger.log('loader: web page throw an exception, getting text');
            driver.getText('#exception').then(text => {
               reject('Web page error: ' + text);
            }).catch(reject);
         });
      });
   }
}

exports.Loader = Loader;

/**
 * Запускает тестирование
 * @param {Object} config Конфигурация тестирования
 */
exports.run = function(config) {
   if (config.reportFile) {
      reporter.setFileName(config.reportFile);

      //Remove old report
      reporter.clear();
   }

   //Create testing loader
   let loader = new Loader();
   let stopInProgress = false;

   let stopOnError = err => {
      logger.log('An error occurred: ' + err);
      if (stopInProgress) {
         throw err;
      }
      stopInProgress = true;
      logger.log('Stoping loader: ' + err);
      loader.stop().then(() => {
         logger.log('1Stoping loader: ' + err);
         throw err;
      }).catch((err) => {
         logger.log('2Stoping loader: ' + err);
         throw err;
      });
   };

   process.on('uncaughtException', stopOnError);

   //Run testing
   loader.start(config.url).then(() => {
      //Loading report
      loader.getReport().then(report => {
         //Logging report
         logger.log(report);

         loader.stop().catch(stopOnError);

         //Save report to the specified file
         if (config.reportFile) {
            reporter.save(report);
         }
      }).catch(err => {
         logger.log('getReport() rejected ' + err);
         loader.stop().then(() => {
            logger.log('1getReport() rejected ' + err);
            stopOnError(err);
         }).catch((err) => {
            logger.log('2getReport() rejected ' + err);
            stopOnError(err);
         });
      });
   }).catch(stopOnError);
};

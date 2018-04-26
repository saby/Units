/**
 * Прогоняет unit тесты в среде Selenium webdriver.
 */

let DriverProvider = require('./webdriver').Provider,
   DriverChecker = require('./webdriver').Checker,
   config = require('../etc/browser.json'),
   fromEnv = require('./util').fromEnv,
   report = require('./unit').report;

const logger = console;

fromEnv(config, 'BROWSER');

/**
 * Загружает URL через webdriver, получает отчет
 * @param {DriverProvider} driver Драйвер
 * @param {String} url URL
 * @param {Function} done При успешном завершении операции
 */
function loadUrl(driver, url, done) {
   logger.log('loader: going to URL ' + url);
   driver.url(url).then(() => {
      logger.log('loader: URL ' + url + ' loaded');
      done();
   }).catch((err) => {
      logger.log('loader: unable go to URL ' + url);
      throw err;
   });
}

/**
 * Запускает тестирование через webdriver, возвращает отчет.
 */
class Loader extends Object {
   constructor() {
      super();
      this._provider = new DriverProvider();
   }

   get provider() {
      return this._provider;
   }

   get driver() {
      return this.provider.getDriver();
   }

   /**
    * Запускает loader
    * @param {String} url URL страницы с тестами
    * @param {Function} done При успешном завершении операции
    */
   start(url, done) {
      this.provider.startUp(err => {
         if (err) {
            throw err;
         }

         loadUrl(this.driver, url, done);
      });
   }

   /**
    * Останавливает loader
    * @param {Function} done При успешном завершении операции
    */
   stop(done) {
      this.provider.tearDown(done);
   }

   /**
    * Возвращает отчет о прохождении тестов
    * @param {Function} done При успешном завершении операции
    * @param {Function} fail При ошибке
    */
   getReport(done, fail) {
      let driver = this.driver,
         checker = new DriverChecker(driver, {
            timeout: config.checkerTimeout
         }),
         finished = false;

      checker.start((checksDone) => {
         //Ждем завершения тестов
         driver.isExisting('body.tests-finished', (err, isExisting) => {
            if (finished) {
               return;
            }
            logger.log('loader: check testing done - ' + isExisting);
            if (err) {
               fail(err);
            }
            if (!isExisting) {
               return;
            }

            finished = true;
            checksDone();

            logger.log('loader: retrieving report');
            driver.getValue('#report', false, (err, text) => {
               if (err) {
                  fail(err);
               }
               logger.log('loader: report retrieved');
               done(text);
            });
         });

         //Проверяем исключения
         driver.isExisting('#exception', (err, isExisting) => {
            logger.log('loader: check exception - ' + isExisting);
            if (!isExisting) {
               return;
            }

            logger.log('loader: web page throw an exception, getting text');
            checksDone();
            driver.getText('#exception').then(text => {
               fail('Web page error: ' + text);
            });
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
      report.setFileName(config.reportFile);

      //Удаляем старый отчет
      report.clear();
   }

   //Загружаем новый
   let loader = new Loader();
   let stopInProgress = false;
   let stopOnError = err => {
      logger.log('An error occurred: ' + err);
      if (stopInProgress) {
         throw err;
      }
      stopInProgress = true;
      loader.stop(() => {
         throw err;
      });
   };

   process.on('uncaughtException', stopOnError);

   loader.start(config.url, () => {
      loader.getReport(reportContent => {
         //Выводим отчет
         logger.log(reportContent);

         loader.stop();

         if (config.reportFile) {
            //Сохраняем отчет
            report.save(reportContent);
         }
      }, stopOnError);
   });
};

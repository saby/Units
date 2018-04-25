/**
 * Работа с Selenium webdriver
 */

let npmScript = require('./npm-script'),
   fromEnv = require('./util').fromEnv,
   config = require('../etc/webdriver.json');

const logger = console;

fromEnv(config, 'WEBDRIVER');

/**
 * Точка доступа к Selenium webdriver
 */
class Provider extends Object {
   constructor() {
      super();
      this._serverProc = undefined;
      this._driver = undefined;
      this._exitOnStop = false;
   }

   /**
    * Запускает Selenium сервер
    * @param {Function} done При успешном завершении операции
    */
   startServer(done) {
      if (Provider.isRemoteMode()) {
         return done && done();
      }

      logger.log('provider: installing selenium server');
      npmScript('install-selenium', () => {
         logger.log('provider: starting selenium server');
         let selenium = require('selenium-standalone');

         selenium.start({}, (err, child) => {
            if (err) {
               throw new Error(err.toString());
            }

            child.stdout.on('data', data => {
               logger.log('provider stdio: ' + data.toString());
            });

            child.stderr.on('data', data => {
               logger.log('provider stdio: ' + data.toString());
            });

            this._serverProc = child;
            logger.log('provider: selenium server started');
            done && done(err, child);
         });
      });
   }

   /**
    * Останавливает Selenium сервер
    * @param {Function} done При успешном завершении операции
    */
   stopServer(done) {
      if (Provider.isRemoteMode() || !this._serverProc) {
         return done && done();
      }

      logger.log('provider: stopping selenium server');
      this._serverProc.on('close', code => {
         logger.log('provider: selenium server stopped');
         done && done(code);

         if (this._exitOnStop) {
            process.exit(255);
         }
      });

      this._serverProc.kill();
      this._serverProc = undefined;
   }

   /**
    * Создает экземпляр webdriver
    * @param {Function} done При успешном завершении операции
    */
   buildDriver(done) {
      logger.log('provider: installing webdriver');
      npmScript('install-webdriver', () => {
         let webdriverio = require('webdriverio');

         logger.log('provider: building webdriver');
         this._driver = webdriverio
            .remote(config.remote)
            .init();
         logger.log('provider: webdriver builded');
         done && done();
      });
   }

   /**
    * Уничтожает экземпляр webdriver
    * @param {Function} done При успешном завершении операции
    */
   destroyDriver(done) {
      if (this._driver) {
         logger.log('provider: destroyng webdriver');
         this._driver.endAll(() => {
            logger.log('provider: webdriver destroyed');
            done && done();
         });
         delete this._driver;
      }
   }

   /**
    * Возвращает экземпляр webdriver
    * @return {Object}
    */
   getDriver() {
      return this._driver;
   }

   /**
    * Запускает точку доступа
    * @param {Function} done При успешном завершении операции
    */
   startUp(done) {
      this.startServer(() => {
         this.buildDriver(() => {
            done && done.apply(this, arguments);
         });
      });
   }

   /**
    * Останавливает точку доступа
    * @param {Function} done При успешном завершении операции
    */
   tearDown(done) {
      this.destroyDriver(() => {
         this.stopServer(() => {
            done && done();
         });
      });
   }

   /**
    * Устанвливает признак, завершать процесс при остановке
    * @param {Boolean} doExit Завершать процесс при остановке
    */
   setExitOnStop(doExit) {
      this._exitOnStop = doExit;
   }
}

/**
 * Проверяет, запускается ли Selenium в ручном режиме
 * @return {Boolean}
 */
Provider.isRemoteMode = function() {
   return !!config.remote.enabled;
};

/**
 * Устанавливает Selenium сервер
 * @param {Function} done При успешном завершении операции
 */
Provider.installServer = function(done) {
   if (this.isRemoteMode()) {
      return done && done();
   }

   logger.log('provider: installing selenium server');
   let selenium = require('selenium-standalone');
   config.install = config.install || {};
   config.install.logger = message => {
      logger.log(message);
   };

   selenium.install(config.install, err => {
      if (err) {
         throw err;
      }
      logger.log('provider: selenium server installed');
      done && done();
   });
};

/**
 * Проверяет состояние в webdriver через равные промежутки времени.
 * Используется для ожидания завершения каких-либо процессов, которые могут об этом как-то сообщить.
 * О том, как именно процесс сообщает о своем состоянии, знает тот, кто запустил процесс.
 * @param {Object} driver Экземпляр webdriver
 * @param {Object} config Конфигурация
 */
class Checker extends Object {
   constructor(driver, config) {
      super();

      this._driver = driver;

      this._config = Object.assign(config || {}, {
         delay: 200, //Задержка перед пуском
         interval: 3000, //Интервал проверки
         timeout: 60000, //Таймаут, по истечении которого не имеет смысла больше ждать
         onError: err => {
            throw err;
         }
      });
   }

   get driver() {
      return this._driver;
   }

   get config() {
      return this._config;
   }

   /**
    * Запускает цикл ожидания
    * @param {Function} callback Callback, вызываемый в каждый интервал проверки
    */
   start(callback) {
      logger.log('provider: starting interval checker');

      let config = this.config;
      this.driver.timeoutsImplicitWait(config.delay, () => {
         logger.log('provider: starting timer for ' + config.interval + 'ms');
         this._timer = setInterval(() => {
            config.timeout -= config.interval;
            if (config.timeout > 0) {
               this.check(callback);
            } else {
               this.stop();
               config.onError(new Error('Cannot wait anymore. Exiting by timeout.'));
            }

         }, config.interval);
      });
   }

   /**
    * Останавливает цикл ожидания окончания прохождения тестов
    */
   stop() {
      logger.log('provider: stopping interval checker');
      if (this._timer) {
         clearInterval(this._timer);
      }
   }

   /**
    * Проверяет состояние отслеживаемого процесса
    * @param {Function} callback Callback, вызываемый в каждый интервал проверки
    */
   check(callback) {
      callback(() => {
         this.stop();
      });
   }
}

exports.Provider = Provider;
exports.Checker = Checker;

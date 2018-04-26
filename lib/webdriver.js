/**
 * Работа с Selenium webdriver
 */

let npmScript = require('./npm-script'),
   pathTo = require('./util').pathTo,
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
    * @property {Object} Экземпляр webdriver
    */
   get driver() {
      return this._driver;
   }

   /**
    * @property {Boolean} Устанвливает признак, завершения процесса при остановке
    */
   set exitOnStop(value) {
      this._exitOnStop = value;
   }

   /**
    * Запускает Selenium сервер
    * @return {Promise}
    */
   startServer() {
      return new Promise((resolve, reject) => {
         if (Provider.isRemoteMode()) {
            return resolve(null);
         }

         let startSelenium = () => {
            logger.log('webdriver: starting selenium server');
            try {
               let selenium = require('selenium-standalone');

               selenium.start({}, (err, child) => {
                  if (err) {
                     reject(err);
                  }

                  child.stdout.on('data', data => {
                     logger.log('webdriver stdio: ' + data.toString());
                  });
                  child.stderr.on('data', data => {
                     logger.log('webdriver stdio: ' + data.toString());
                  });

                  this._serverProc = child;
                  logger.log('webdriver: selenium server started');
                  resolve(child);
               });
            } catch (err) {
               reject(err);
            }
         };

         if (pathTo('selenium-standalone', false)) {
            startSelenium();
         } else {
            logger.log('webdriver: installing selenium server');
            npmScript('install-selenium', startSelenium);
         }
      });
   }

   /**
    * Останавливает Selenium сервер
    * @return {Promise}
    */
   stopServer() {
      return new Promise((resolve, reject) => {
         if (Provider.isRemoteMode() || !this._serverProc) {
            return resolve(null);
         }

         logger.log('webdriver: stopping selenium server');
         this._serverProc.on('close', code => {
            logger.log('webdriver: selenium server stopped');
            resolve(code);

            if (this._exitOnStop) {
               process.exit(255);
            }
         });
         this._serverProc.on('uncaughtException', reject);

         this._serverProc.kill();
         this._serverProc = undefined;
      });
   }

   /**
    * Создает экземпляр webdriver
    * @return {Promise}
    */
   buildDriver() {
      return new Promise((resolve, reject) => {
         let createWebdriver = () => {
            try {
               let webdriverio = require('webdriverio');

               logger.log('webdriver: building webdriver');
               this._driver = webdriverio
                  .remote(config.remote)
                  .init();
               logger.log('webdriver: webdriver builded');

               resolve(this._driver);
            } catch (err) {
               reject(err);
            }
         };

         if (pathTo('webdriverio', false)) {
            createWebdriver();
         } else {
            logger.log('webdriver: installing webdriver');
            npmScript('install-webdriver', createWebdriver);
         }
      });
   }

   /**
    * Уничтожает экземпляр webdriver
    * @return {Promise}
    */
   destroyDriver() {
      return new Promise((resolve, reject) => {
         if (!this._driver) {
            return resolve();
         }

         try {
            logger.log('webdriver: destroyng webdriver');
            this._driver.endAll(() => {
               logger.log('webdriver: webdriver destroyed');
               resolve();
            }, reject);
            delete this._driver;
         } catch (err) {
            reject(err);
         }
      });
   }

   /**
    * Запускает точку доступа
    * @return {Promise}
    */
   startUp() {
      return new Promise((resolve, reject) => {
         this.startServer().then(() => {
            this.buildDriver().then(resolve).catch(reject);
         }).catch(reject);
      });
   }

   /**
    * Останавливает точку доступа
    * @return {Promise}
    */
   tearDown() {
      return new Promise((resolve, reject) => {
         this.destroyDriver().then(() => {
            this.stopServer().then(resolve).catch(reject);
         }).catch(reject);
      });
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
         timeout: 10000 //Таймаут, по истечении которого не имеет смысла больше ждать
      });
   }

   get driver() {
      return this._driver;
   }

   get config() {
      return this._config;
   }

   /**
    * Запускает цикл ожидания выполнения условий проверки
    * @param {Function:Promise} checker Функция, вызываемая в каждый интервал проверки
    * @return {Promise}
    */
   start(checker) {
      let config = this.config;

      return new Promise((resolve, reject) => {
         logger.log('webdriver: starting interval checker');

         let handler = () => {
            logger.log('webdriver: checking handler');
            config.timeout -= config.interval;
            if (config.timeout > 0) {
               logger.log('webdriver: check if all ready');
               checker().then(result => {
                  if (result instanceof Array) {
                     result = result.reduce((memo, curr) => {
                        return memo || curr;
                     }, false);
                  }

                  if (result) {
                     logger.log('webdriver: go next checking in ' + config.interval + 'ms');
                     setTimeout(handler, config.interval);
                  } else {
                     resolve();
                  }
               }).catch(err => {
                  logger.log('webdriver: stopping interval checker: ' + err);
                  reject(err);
               });
            } else {
               logger.log('webdriver: cannot wait anymore. Exiting by timeout.');
               reject(new Error('Cannot wait anymore. Exiting by timeout.'));
            }

         };

         this.driver.timeoutsImplicitWait(config.delay, () => {
            logger.log('webdriver: starting timer for ' + config.interval + 'ms');
            setTimeout(handler, config.interval);
         });
      });
   }
}

exports.Provider = Provider;
exports.Checker = Checker;

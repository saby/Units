/**
 * Selenium webdriver workaround
 */

const npmScript = require('./npmScript');
const pathTo = require('./util').pathTo;
const fromEnv = require('./util').fromEnv;
const config = require('../etc/webdriver.json');

const logger = console;
const LOG_TAG = 'webdriver:';

fromEnv(config, 'WEBDRIVER');

//Support for webdriverio@4.12.x config
if (config.host) {
   config.hostname = config.host;
}
if (config.desiredCapabilities && config.desiredCapabilities.browserName) {
   config.capabilities.browserName = config.desiredCapabilities.browserName;
}

/**
 * Selenium webdriver access point
 */
class Provider {
   constructor() {
      this._exitOnStop = false;
   }

   /**
    * @property {Object} Webdriver instance
    */
   get driver() {
      return this._driver;
   }

   /**
    * @property {Boolean} Sets exit process on stop flag
    */
   set exitOnStop(value) {
      this._exitOnStop = value;
   }

   /**
    * Starts local Selenium server
    * @return {Promise}
    */
   startServer() {
      return new Promise((resolve, reject) => {
         if (Provider.isRemoteMode()) {
            return resolve(null);
         }

         let startSelenium = () => {
            logger.log(LOG_TAG, 'Starting selenium server');
            try {
               let selenium = require('selenium-standalone');

               selenium.start({}, (err, child) => {
                  if (err) {
                     reject(err);
                  }

                  child.stdout.on('data', data => {
                     logger.log(LOG_TAG, `selenium stdio: ${data.toString()}`);
                  });
                  child.stderr.on('data', data => {
                     logger.log(LOG_TAG, `selenium stdio: ${data.toString()}`);
                  });

                  this._serverProc = child;
                  logger.log(LOG_TAG, 'Selenium server started');
                  resolve(child);
               });
            } catch (err) {
               logger.log(LOG_TAG `Can't start selenium server: ${err}`);
               reject(err);
            }
         };

         if (pathTo('selenium-standalone', false)) {
            startSelenium();
         } else {
            logger.log(LOG_TAG, 'Installing selenium server');
            npmScript('install-selenium').then(startSelenium).catch(reject);
         }
      });
   }

   /**
    * Stops local Selenium server
    * @return {Promise}
    */
   stopServer() {
      return new Promise((resolve, reject) => {
         if (Provider.isRemoteMode() || !this._serverProc) {
            return resolve(null);
         }

         logger.log(LOG_TAG, 'Stopping selenium server');
         this._serverProc.on('close', code => {
            logger.log(LOG_TAG, 'Selenium server stopped');
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
    * Builds webdriver instance
    * @return {Promise}
    */
   buildDriver() {
      return new Promise((resolve, reject) => {
         let createWebdriver = () => {
            try {
               let webdriverio = require('webdriverio');

               logger.log(LOG_TAG, 'Building webdriver with config', JSON.stringify(config.remote));
               webdriverio.remote(config.remote).then((driver) => {
                   this._driver = driver;
                  logger.log(LOG_TAG, 'Webdriver builded');
                  resolve(driver);
               }).catch(reject);
            } catch (err) {
               reject(err);
            }
         };

         if (pathTo('webdriverio', false)) {
            createWebdriver();
         } else {
            logger.log(LOG_TAG, 'Installing webdriver');
            npmScript('install-webdriver').then(createWebdriver).catch(reject);
         }
      });
   }

   /**
    * Destroys webdriver instance
    * @return {Promise}
    */
   destroyDriver() {
      return new Promise((resolve, reject) => {
         if (!this.driver) {
            return resolve();
         }

         try {
            logger.log(LOG_TAG, 'Destroyng webdriver');
            this.driver.deleteSession().then(() => {
               logger.log(LOG_TAG, 'Webdriver destroyed');
               resolve();
            }).catch(reject);
            delete this._driver;
         } catch (err) {
            reject(err);
         }
      });
   }

   /**
    * Starts up access point
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
    * Tears down access point
    * @return {Promise}
    */
   tearDown() {
      return new Promise((resolve, reject) => {
         this.destroyDriver().then(() => {
            this.stopServer().then(resolve).catch(reject);
         }).catch(err => {
            this.stopServer().then(() => {
               reject(err);
            }).catch(reject);
         });
      });
   }
}

/**
 * Check if remote Selenium used
 * @return {Boolean}
 */
Provider.isRemoteMode = function() {
   return !!config.remote.enabled;
};

/**
 * Checks webdriver state vai time intervals
 * Used to waiting for complete some long async process.
 * @param {Object} driver Webdriver instance
 * @param {Object} config Config
 */
class Checker {
   constructor(driver, config) {
      this._driver = driver;

      this._config = Object.assign(config || {}, {
         interval: 10000, //Checking interval
         timeout: 180000, //Checking timeout
         implictTimeout: 5000, //Timeout of when to abort locating an element.
         loadTimeout: 10000, //Timeout limit used to interrupt navigation of the browsing context.
         scriptTimeout: 10000 //Timeout of when to interrupt a script that is being evaluated
      });
   }

   /**
    * @property {Object} Webdriver instance
    */
   get driver() {
      return this._driver;
   }

   /**
    * @property {Object} Config
    */
   get config() {
      return this._config;
   }

   /**
    * Runs waiting cycle with interval checking for complete
    * @param {Function:Promise} checker Checker that returns complete flag
    * @return {Promise}
    */
   start(checker) {
      let config = this.config;

      return new Promise((resolve, reject) => {
         logger.log(LOG_TAG, 'Starting interval checker');
         let finished = false;
         let timeoutHandle;

         let finish = () => {
            finished = true;
            clearTimeout(timeoutHandle);
         };

         let handler = () => {
            if (finished) {
               return;
            }

            logger.log(LOG_TAG, 'A new checking attempt');

            //Check the waiting is over
            checker().then(result => {
               logger.log(LOG_TAG, `Checking returns result: ${result}`);

               if (finished) {
                  return;
               }

               //If array check for any false-like member in it
               if (result instanceof Array) {
                  result = result.reduce((memo, curr) => {
                     return curr ? memo : curr;
                  }, result.length !== 0);
               }

               if (result) {
                  logger.log(LOG_TAG, `Waiting ${config.interval}ms before next checking attempt`);
                  setTimeout(handler, config.interval);
               } else {
                  logger.log(LOG_TAG, 'Interval checking finished');
                  finish();
                  resolve();
               }
            }).catch(err => {
               logger.log(`webdriver', 'Interval checker ejected with: ${err}`);
               if (finished) {
                  return;
               }
               finish();
               reject(err);
            });
         };

         //Setup timeouts
         this.driver.setTimeout({
            script: config.scriptTimeout,
            pageLoad: config.loadTimeout,
            implicit: config.implictTimeout
         });

         //Start interval checker
         setTimeout(handler, config.interval);

         //Start timeout checker
         timeoutHandle = setTimeout(() => {
            logger.log(LOG_TAG, 'Can\'t wait anymore. Exiting by timeout.');
            if (!finished) {
               finished = true;
               reject(new Error('Can\'t wait anymore. Exiting by timeout.'));
            }
         }, config.timeout);
      });
   }
}

exports.Provider = Provider;
exports.Checker = Checker;

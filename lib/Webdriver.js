/**
 * Selenium webdriver workaround
 */

const npmScript = require('./npmScript');
const pathTo = require('./util').pathTo;
const fromEnv = require('./util').fromEnv;
const config = require('../etc/webdriver.json');

const logger = console;
const LOG_TAG = '[Webdriver]';

//Support for webdriverio@4.12.x config
config.remote.host = '';
config.remote.desiredCapabilities = {browserName: ''};

fromEnv(config, 'WEBDRIVER');

const driverConfig = config.remote;
driverConfig.port = parseInt(driverConfig.port, 10);

//Support for webdriverio@4.12.x config
if (driverConfig.host) {
   driverConfig.hostname = driverConfig.host;
}
delete driverConfig.host;
if (driverConfig.desiredCapabilities.browserName) {
   driverConfig.capabilities.browserName = driverConfig.desiredCapabilities.browserName;
}
delete driverConfig.desiredCapabilities;

/**
 * Selenium webdriver remote DOM provider.
 * Allows to open certain URL and interact with DOM state using selectors.
 */
class Webdriver {
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
         if (Webdriver.isRemoteMode()) {
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
                     logger.log(LOG_TAG, `selenium stderr: ${data.toString()}`);
                  });

                  this._serverProc = child;
                  logger.log(LOG_TAG, 'Selenium server started');
                  resolve(child);
               });
            } catch (err) {
               logger.log(LOG_TAG, `Can't start selenium server: ${err}`);
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
         if (Webdriver.isRemoteMode() || !this._serverProc) {
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

               logger.log(LOG_TAG, 'Building webdriver with config', JSON.stringify(driverConfig));
               webdriverio.remote(driverConfig).then((driver) => {
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
    * Opens given URL
    * @param {String} url URL to open
    */
   open(url) {
      return this.driver.url(url);
   }

   /**
    * Executes DOM query
    * @param {String} selector Query selector
    */
   querySelector(selector) {
      return this.driver.$(selector);
   }

   /**
    * Takes page screenshot and saves it into file with given name
    * @param {String} pathFile File name to save screenshot to
    */
   saveScreenshot(pathFile) {
      return this.driver.saveScreenshot(pathFile);
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
 * Check if remote Selenium is used
 * @return {Boolean}
 */
Webdriver.isRemoteMode = function() {
   return !!config.remote.enabled;
};

module.exports = Webdriver;

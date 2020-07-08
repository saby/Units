/**
 * Chrome workaround
 */

const chromeLauncher = require('chrome-launcher');
const chromeRemoteInterface = require('chrome-remote-interface');
const fs = require('fs');

const logger = console;
const LOG_TAG = '[Chrome]';
const flagForChrome = ['--disable-gpu', '--no-sandbox'];

/**
 * Chrome remote DOM provider which can be ran in headless mode.
 * Allows to open certain URL and interact with DOM state using selectors.
 * @param {Object} driver Webdriver instance
 * @param {Object} [config] Config
 */
class Chrome {
   /**
    * @param {Object} cfg Configuration
    * @param {Number} cfg.port Port number to start on
    * @param {Boolean} cfg.headless Headless mode flag
    */
   constructor(cfg) {
      if (cfg) {
         this.workPort = cfg.port;
         this.headless = cfg.headless;
      }
   }

   /**
    * @property {Number} Using port number
    */
   get port() {
      return this.chrome && this.chrome.port || this.workPort;
   }

   /**
    * Loads Chrome process
    */
   async load() {
      if (!this.chrome) {
         if (this.headless) {
            flagForChrome.push('--headless');
         }

         this.chrome = await chromeLauncher.launch({
            port: this.port,
            chromeFlags: flagForChrome
         });

         logger.log(LOG_TAG, `${this.headless ? 'Headless' : ''} chrome started`);
      }
   }

   /**
    * Connects to Chrome process
    */
   async connect() {
      if (!this.drive) {
         this.drive = await chromeRemoteInterface({
            port: this.port
         });

         await Promise.all([this.drive.Page.enable(), this.drive.Runtime.enable()]);
      }
   }

   /**
    * Starts up Chrome process instance
    */
   async startUp() {
      const delay = t => new Promise(resolve => setTimeout(resolve, t));

      // Try to connect several times because sometimes Chrome doesn't start properly
      const triesCount = 5;
      for (let i = 0; i < triesCount; i++) {
         try {
            await this.load();
            await this.connect();
            break;
         } catch (err) {
            logger.log(`Connection try ${i + 1} of ${triesCount} failed. Unexpectable error: ${err}.`);
            await delay(500);
         }
      }

      if (!this.drive) {
         throw new Error('ERRCHROMEDRV: Chrome driver hasn\'t been created');
      }

      this.subscribeDriveConsole();
   }

   /**
    * Tears down Chrome process instance
    */
   async tearDown() {
      if (this.chrome) {
         await this.chrome.kill();
         this.chrome = undefined;
      }

      if (this.drive) {
         await this.drive.close();
         this.drive = undefined;
      }
   }

   /**
    * Opens given URL
    * @param {String} url URL to open
    */
   open(url) {
      return new Promise(async(resolve, reject) => {
         try {
            const result = await this.drive.Page.navigate({
               url: url
            });

            if (result.errorText) {
               reject(result.errorText);
               return;

            }

            this.drive.Page.loadEventFired(async() => {
               resolve();
            });
         } catch (err) {
            reject(err);
         }
      });
   }

   /**
    * Executes DOM query
    * @param {String} selector Query selector
    */
   querySelector(selector) {
      return new Promise((resolve, reject) => {
         this.drive.Runtime.evaluate({
            expression: `document.querySelector("${selector}")`
         }).then((result) => {

            result.result.getValue = () => {
               return new Promise((resolve, reject) => {
                  this.drive.Runtime.evaluate({
                     expression: `document.querySelector("${selector}").value `
                  }).then((value) => {
                     resolve(value.result.value);
                  }).catch(reject);
               });
            };

            result.result.getText = () => {
               return new Promise((resolve, reject) => {
                  this.drive.Runtime.evaluate({
                     expression: `document.querySelector("${selector}").textContent`
                  }).then((value) => {
                     resolve(value.result.value);
                  }).catch(reject);
               });
            };

            result.result.isExisting = () => {
               return new Promise((resolve, reject) => {
                  try {
                     if (result.result && result.result.className) {
                        resolve(true);
                     } else {
                        resolve(false);
                     }
                  } catch (err) {
                     reject(err);
                  }
               });
            };

            resolve(result.result);
         }).catch(reject);
      });
   }

   /**
    * Takes page screenshot and saves it into file with given name
    * @param {String} pathFile File name to save screenshot to
    */
   saveScreenshot(pathFile) {
      return new Promise((resolve, reject) => {
         this.drive.Page.captureScreenshot({format: 'png', fromSurface: true}).then((result) => {
            fs.writeFile(pathFile, result.data, 'base64', (error) => {
               error ? reject(error) : resolve(pathFile);
            });
         }).catch(reject);
      });
   }

   /**
    * Subsribes to the Chrome console API and translates messages from there to the local log
    */
   subscribeDriveConsole() {
      this.drive.Runtime.consoleAPICalled((params) => {
         const {args, type} = params;
         const event = args[0];
         const errorTag = '[ERROR]';
         if (event && type === 'error') {
            if (event.subtype ===  'error') {
               logger.log(LOG_TAG, errorTag, event.description);
            } else if (event.value) {
               logger.log(LOG_TAG, errorTag, event.value);
            }
         }
      });
   }
}

module.exports = Chrome;

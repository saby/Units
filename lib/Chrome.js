const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const fs = require('fs');

const logger = console;
const LOG_TAG = '[Chrome]';
const flagForChrome = ['--disable-gpu', '--no-sandbox'];

class Chrome {
   constructor(cfg) {
      if (cfg) {
         this.workPort = cfg.port;
         this.headless = cfg.headless;
      }
   }

   get port() {
      return this.chrome && this.chrome.port || this.workPort;
   }

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

   async connect() {
      if (!this.drive) {
         this.drive = await CDP({
            port: this.port
         });

         await Promise.all([this.drive.Page.enable(), this.drive.Runtime.enable()]);
      }
   }

   async startUp() {
      await this.load();
      await this.connect();
      this.subscribeDriveConsole();
   }

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

   open(url) {
      return new Promise(async (resolve, reject) => {
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

   saveScreenshot(pathFile) {
      return new Promise((resolve, reject) => {
         this.drive.Page.captureScreenshot({format: 'png', fromSurface: true}).then((result) => {
            fs.writeFile(pathFile, result.data, 'base64', (error) => {
               error ? reject(error) : resolve(pathFile);
            });
         }).catch(reject);
      });
   }

   subscribeDriveConsole() {
      this.drive.Runtime.consoleAPICalled((params) => {
         const {args,type} = params;
         const event = args[0];
         const errorTag = '[ERROR]';
         if (event && type === 'error' ) {
            if (event.subtype ===  'error'){
               logger.log(LOG_TAG, errorTag, event.description);
            } else if(event.value) {
               logger.log(LOG_TAG, errorTag, event.value);
            }
         }
      });
   }
}

module.exports = Chrome;

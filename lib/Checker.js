const LOG_TAG = '[Checker]';
const logger = console;


/**
 * Checks webdriver state vai time intervals
 * Used to waiting for complete some long async process.
 * @param {Object} driver Webdriver instance
 * @param {Object} [config] Config
 */
class Checker {
   constructor(driver, config) {
      this._driver = driver;

      this._config = Object.assign({
         interval: 10000, //Checking interval
         timeout: 4 * 60000, //Checking timeout
         implictTimeout: 5000, //Timeout of when to abort locating an element.
         loadTimeout: 10000, //Timeout limit used to interrupt navigation of the browsing context.
         scriptTimeout: 10000 //Timeout of when to interrupt a script that is being evaluated
      }, config || {});
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

               //If array check for any true-like member in it
               if (result instanceof Array) {
                  result = result.reduce((memo, curr) => {
                     return curr || memo;
                  }, false);
               }

               if (result) {
                  logger.log(LOG_TAG, 'Interval checking finished');
                  finish();
                  resolve();
               } else {
                  logger.log(LOG_TAG, `Waiting ${config.interval}ms before next checking attempt`);
                  setTimeout(handler, config.interval);
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
         if (typeof this.driver.setTimeout === 'function') {
            this.driver.setTimeout({
               script: config.scriptTimeout,
               pageLoad: config.loadTimeout,
               implicit: config.implictTimeout
            });
         }

         //Start interval checker
         setTimeout(handler, config.interval);

         //Start timeout checker
         timeoutHandle = setTimeout(() => {
            const timeoutMessage = `Can't wait anymore, exiting by timeout ${config.timeout}ms.`;
            logger.log(LOG_TAG, timeoutMessage);
            if (!finished) {
               finished = true;
               reject(new Error(timeoutMessage));
            }
         }, config.timeout);
      });
   }
}

module.exports = Checker;

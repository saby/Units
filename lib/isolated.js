/* global global */

/**
 * Runs unit testing via Node.js environment.
 */

let path = require('path');
let fs = require('fs');
let unit = require('./unit');
let {WS_CORE_PATH, WS_CORE_REQUIREJS, WS_CORE_CONFIG} = require('./constants');
let setupLogger = require('./ws/logger').setup;
let prepareEnvironment = require('./ws/prepareEnvironment');
let loadContents = require('./ws/loadContents');
let setupRequireJs = require('./ws/setup').requireJs;
let saveReport = require('./saveReport');

const logger = console;

function testAmdModules(testsList, projectRootPath, wsRootPath) {
   //Load r.js from WS if possible
   let requirejsPath = path.resolve(path.join(projectRootPath, wsRootPath, WS_CORE_REQUIREJS));
   if (!fs.existsSync(requirejsPath)) {
      //Otherwise use npm package
      requirejsPath = 'requirejs';
   }
   let requirejs = require(requirejsPath);

   //Prepare WS environment
   prepareEnvironment(requirejs, wsRootPath);

   //Load contents.json
   let contents = loadContents(projectRootPath);

   try {
      //Setup RequireJS
      let requirejsConfigPath = path.resolve(path.join(projectRootPath, wsRootPath, WS_CORE_CONFIG));
      setupRequireJs(requirejs, requirejsConfigPath, projectRootPath, wsRootPath, contents);

      //Setup logger
      setupLogger(requirejs);
   } catch (err) {
      if (err.originalError) {
         logger.error(`Core initialization failed: ${err}`);
      }
      throw (err.originalError || err);
   }

   //Run testing
   let errors = [];
   unit.test.amdfyList(projectRootPath, testsList).forEach(test => {
      try {
         requirejs(test);
      } catch (err) {
         if (err.originalError) {
            logger.error(err.originalError);
         }
         errors.push(`Module '${test}' failed with error: ${err}`);
      }
   });

   return errors;
}

/**
 * Runs unit testing via Node.js
 * @param {Object} config Testing config
 */
exports.run = function(config) {
   logger.log('Testing with config:', config);

   const PROJECT_ROOT = config.root || '';

   let testsList = unit.test.getList(path.join(PROJECT_ROOT, config.tests));

   let errors = testAmdModules(
      testsList,
      PROJECT_ROOT,
      WS_CORE_PATH
   );

   if (config.reportFile) {
      saveReport(config.reportFile);
   }

   process.on('exit', () => {
      if (errors.length) {
         throw new Error(`There are some test cases which wasn't ran because of errors: \n ${errors.join('\n')}`);
      }
   });
};

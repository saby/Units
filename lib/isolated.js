/* global global */

/**
 * Runs unit testing via Node.js environment.
 */

let path = require('path');
let fs = require('fs');
let unit = require('./unit');
let setupLogger = require('./ws/logger').setup;
let prepareEnvironment = require('./ws/prepareEnvironment');
let loadContents = require('./ws/loadContents');
let setupRequireJs = require('./ws/setup').requireJs;
let setupJsModules = require('./ws/setup').jsModules;
let saveReport = require('./saveReport');

const logger = console;

function testAmdModules(testsList, projectRootPath, wsRootPath, resourcesPath) {
   //Load r.js from WS if possible
   let requirejsPath = path.resolve(path.join(projectRootPath, wsRootPath, 'ext/requirejs/r.js'));
   if (!fs.existsSync(requirejsPath)) {
      //Otherwise use npm package
      requirejsPath = 'requirejs';
   }
   let requirejs = require(requirejsPath);

   //Prepare WS environment
   prepareEnvironment(requirejs, wsRootPath, resourcesPath);

   //Load contents.json
   let contents = loadContents(projectRootPath, resourcesPath);

   //Setup jsModules section
   setupJsModules(contents, requirejs, resourcesPath);

   //Setup RequireJS
   let requirejsConfigPath = path.resolve(path.join(projectRootPath, wsRootPath, 'ext/requirejs/config.js'));
   setupRequireJs(requirejs, requirejsConfigPath, projectRootPath, wsRootPath, resourcesPath, contents);

   try {
      //Apply RequireJS patches
      requirejs('Core/patchRequireJS')();

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
   testsList.forEach(test => {
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

   let projectRootPath = config.root || '';
   let testsList = unit.test.getList(path.join(projectRootPath, config.tests));

   let errors = testAmdModules(
      testsList,
      projectRootPath,
      path.join(config.ws, 'ws/'),
      config.resources
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

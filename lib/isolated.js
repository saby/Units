/**
 * Runs unit testing via Node.js environment.
 */

let path = require('path');
let unit = require('./unit');
let {WS_CORE_PATH, WS_CORE_CONFIG} = require('./constants');
let setupLogger = require('./ws/logger').setup;
let prepareEnvironment = require('./ws/prepareEnvironment');
let loadContents = require('./ws/loadContents');
let setupRequireJs = require('./ws/setup').requireJs;
let saveReport = require('./saveReport');
const emulator = require('./emulatorBrowser');
const enableBrowser = require('./ws/enableBrowser');
const wsConfig = require('./ws/wsConfig');

const LOG_TAG = '[isolated]';

const logger = console;

function testAmdModules(testsList, projectRootPath, dependencies, patchedRequire, wsRootPath, emulateBrowser) {
   let requirejs = prepareTestEnvironment(projectRootPath, dependencies, patchedRequire, wsRootPath, emulateBrowser);
   requirejs('Application/Initializer').default();
   //Run testing
   let errors = [];
   unit.test.amdfyList(projectRootPath, testsList).forEach(test => {
      try {
         requirejs(test);
      } catch (err) {
         logger.error(err.originalError || err);
         errors.push(`Module '${test}' failed with error: ${err}`);
      }
   });

   return errors;
}

function prepareTestEnvironment(projectRootPath, dependencies, patchedRequire, wsRootPath, emulateBrowser) {
   let requirejsPath = patchedRequire ? path.resolve(__dirname, './requirejs/r.js') : 'requirejs';
   let requirejs = require(requirejsPath);
   wsRootPath = wsRootPath || WS_CORE_PATH;
   //Prepare WS environment
   prepareEnvironment(requirejs, wsRootPath);

   //Load contents.json
   let contents = loadContents(projectRootPath);
   const cfg = wsConfig({
      resourcePath: '',
      wsPath: wsRootPath,
      appPath: projectRootPath,
      loadCss: false
   });
   if (emulateBrowser) {
      emulator.initGlobalVariable('wsConfig', cfg);
      emulator.initGlobalVariable('contents', contents);
   }

   try {
      //Setup RequireJS
      let requirejsConfigPath = path.resolve(path.join(projectRootPath, wsRootPath, WS_CORE_CONFIG));
      setupRequireJs(requirejs, requirejsConfigPath, projectRootPath, dependencies, wsRootPath, contents);

      if (emulateBrowser) {
         require('./requirejs/define');
      }

      //Setup logger
      setupLogger(requirejs);
   } catch (err) {
      logger.error(`Core initialization failed: ${err.originalError || err}`);
      throw (err.originalError || err);
   }

   if (emulateBrowser) {
      enableBrowser();
   }
   return requirejs;
}

/**
 * Runs unit testing via Node.js
 * @param {Object} config Testing config
 */
function run(config) {
   logger.log(LOG_TAG, 'Testing with config:', config);

   const PROJECT_ROOT = config.root || '';

   if (config.emulateBrowser) {
      emulator.start();
   }

   let testsList = unit.test.getList(PROJECT_ROOT, config.tests);

   let errors = testAmdModules(
      testsList,
      PROJECT_ROOT,
      config.dependencies,
      config.patchedRequire,
      config.ws,
      config.emulateBrowser
   );

   if (config.reportFile) {
      saveReport(config.reportFile);
   }

   process.on('exit', () => {
      if (errors.length) {
         throw new Error(`There are some test cases which wasn't ran because of errors: \n ${errors.join('\n')}`);
      }
   });
}

module.exports = {
   run: run,
   prepareTestEnvironment: prepareTestEnvironment
};

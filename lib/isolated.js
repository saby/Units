/* global global */

/**
 * Runs unit testing via Node.js environment.
 */

let path = require('path'),
   sysfs = require('fs'),
   unit = require('./unit'),
   reporter = unit.report;

const logger = console;

/**
 * Console logger implementation.
 */
class TestConsoleLogger extends Object {
   log(tag, message) {
      logger.log(`${tag}': ${message}`);
   }

   error(tag, message, exception) {
      logger.error(`${tag}: ${message}` + (exception ? exception.toString() : ''));
   }

   info(tag, message) {
      logger.info(`${tag}: ${message}`);
   }
}

/**
 * Setups testing environment
 */
function prepareEnvironment(requirejs, wsRootPath, resourcesPath) {
   global.isMochaRunned = true;
   global.assert = require('chai').assert;
   global.sinon = require('sinon');
   global.requirejs = requirejs;
   global.define = requirejs.define;
   global.wsConfig = {
      wsRoot: wsRootPath,
      resourceRoot: resourcesPath
   };
}

/**
 * Loads contents.json if available
 */
function loadContents(projectRootPath, resourcesPath) {
   let contentsPath = path.resolve(
      path.join(projectRootPath, resourcesPath, 'contents.json')
   );

   let result;
   if (sysfs.existsSync(contentsPath)) {
      result = require(contentsPath);
   }

   return result;
}

/**
 * Setups RequireJS for WS
 */
function setupRequireJs(requirejs, configPath, projectRootPath, wsRootPath, resourcesPath, contents) {
   let config = require(configPath)(
      projectRootPath,
      wsRootPath,
      resourcesPath,
      contents
   );
   config.nodeRequire = require;

   requirejs.config(config);
}

/**
 * Setups jsModules section URLs loaded from contents.json
 */
function setupJsModules(contents, requirejs, resourcesPath) {
   if (contents && contents.jsModules) {
      let constants = requirejs('Core/constants');
      constants.jsModules = constants.jsModules || {};
      Object.keys(contents.jsModules).forEach(module => {
         let modulePath = path.join(
            resourcesPath,
            contents.jsModules[module]
         );
         constants.jsModules[module] = (resourcesPath ? '/' : '') + modulePath;
      });
   }
}

/**
 * Setups console logger
 */
function setupLogger(requirejs) {
   let classicExtend = requirejs('Core/core-functions').classicExtend,
      ioc = requirejs('Core/IoC'),
      ILogger = requirejs('Core/ILogger');

   classicExtend(TestConsoleLogger, ILogger);

   ioc.bindSingle('ILogger', new TestConsoleLogger());
}

/**
 * Intercepts reports content from stdout and writes it to the specified file
 */
function saveReport(fileName) {
   reporter.setFileName(fileName);
   fileName = reporter.getFilename();

   //Remove old report
   reporter.clear();

   logger.log(`Writing report file '${fileName}'`);

   //Intercept stdout by dirty hack
   let writeOriginal = process.stdout.write,
      output = [];

   process.stdout.write = chunk => {
      let str = '' + chunk;
      if (str && str[0] !== '<') {
         str = '<!--' + str + '-->';
      }
      output.push(str);
   };

   process.on('exit', () => {
      process.stdout.write = writeOriginal;
      reporter.save(output.join(''));
   });

}

function testEsmModules(requirejs, projectRootPath, testsPath) {
   let hasErrors = false;

   try {
      //Setup logger
      setupLogger(requirejs);
   } catch (err) {
      throw (err.originalError || err);
   }

   //Run testing
   unit.test.getList(
      path.join(projectRootPath, testsPath)
   ).forEach(test => {
      try {
         let testFileName = path.resolve(test);
         logger.log(`Importing '${testFileName}'`);
         let testCode = sysfs.readFileSync(testFileName);
         (new Function(String(testCode)))();
      } catch (err) {
         logger.error(`Module '${test}' failed with error: ${err}`);
         logger.log(err);
         hasErrors = true;
      }
   });

   return hasErrors;

}

function testAmdModules(requirejs, projectRootPath, testsPath) {
   let hasErrors = false;

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
   unit.test.getList(
      path.join(projectRootPath, testsPath)
   ).forEach(test => {
      try {
         requirejs(test);
      } catch (err) {
         logger.error(`Module '${test}' failed with error: ${err}`);
         if (err.originalError) {
            logger.error(err.originalError);
         }
         hasErrors = true;
      }
   });

   return hasErrors;
}

/**
 * Runs unit testing via Node.js
 * @param {Object} config Testing config
 */
exports.run = function(config) {
   let projectRootPath = config.root || '';
   let wsRootPath = path.join(config.ws, 'ws/');

   //Load r.js from WS if possible
   let requirejsPath = path.resolve(path.join(projectRootPath, wsRootPath, 'ext/requirejs/r.js'));
   if (!sysfs.existsSync(requirejsPath)) {
      //Otherwise use npm package
      requirejsPath = 'requirejs';
   }
   let requirejs = require(requirejsPath);

   //Preparw WS environment
   prepareEnvironment(requirejs, wsRootPath, config.resources);

   //Load contents.json
   let contents = loadContents(projectRootPath, config.resources);

   //Setup jsModules section
   setupJsModules(contents, requirejs, config.resources);

   //Setup RequireJS
   let requirejsConfigPath = path.resolve(path.join(projectRootPath, wsRootPath, 'ext/requirejs/config.js'));
   setupRequireJs(requirejs, requirejsConfigPath, projectRootPath, wsRootPath, config.resources, contents);

   let hasErrors;
   switch (config.moduleType) {
      case 'esm':
         hasErrors = testEsmModules(requirejs, projectRootPath, config.tests);
         break;

      case 'amd':
         hasErrors = testAmdModules(requirejs, projectRootPath, config.tests);
         break;

      default:
         throw new Error(`Unsupported module type ${config.moduleType}`);
   }

   if (config.reportFile) {
      saveReport(config.reportFile);
   }

   process.on('exit', () => {
      if (hasErrors) {
         process.exitCode = 1;
      }
      return process.exitCode;
   });
};

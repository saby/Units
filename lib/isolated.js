/* global global */

/**
 * Runs unit testing via Node.js environment.
 */

let spawn = require('child_process').spawn,
   path = require('path'),
   fs = require('fs'),
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
   if (fs.existsSync(contentsPath)) {
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

function testEsmModules(testsList) {
   let hasErrors = false;

   //Collect modules
   let testingFile = '.unit-testing.mjs';
   let testingCode = testsList.map(test => {
      if (!test.startsWith('.')) {
         test = './' + test;
      }
      return `import '${test}';`;
   }).join('\n');

   testingCode = `
      let assert = require('chai').assert;
      let sinon = require('sinon');
      let wsConfig = {
         wsRoot: wsRootPath,
         resourceRoot: resourcesPath
      };
   ${testingCode}`;

   //Run testing
   try {
      fs.writeFileSync(testingFile, testingCode);

      let tester = spawn(
         'node',
         ['--experimental-modules', testingFile],
         {stdio: 'inherit'}
      );

      //Translate testers exit code to itself
      tester.on('exit', (code, signal) => {
         process.on('exit', function() {
            if (signal) {
               process.kill(process.pid, signal);
            } else {
               process.exit(code);
            }
         });
      });

      // Terminate testers on exit
      process.on('SIGINT', () => {
         tester.kill('SIGINT');
         tester.kill('SIGTERM');
      });
   } catch (err) {
      hasErrors = true;
      logger.error(`Testing unit: \n${testingCode}\nhas been failed.`);
      logger.error(err);
   }

   return hasErrors;

}

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
   testsList.forEach(test => {
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
   let testsList = unit.test.getList(path.join(projectRootPath, config.tests));
   let hasErrors;

   switch (config.moduleType) {
      case 'esm':
         hasErrors = testEsmModules(testsList);
         break;

      case 'amd':
         hasErrors = testAmdModules(
            testsList,
            projectRootPath,
            path.join(config.ws, 'ws/'),
            config.resources
         );
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

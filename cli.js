#!/usr/bin/env node

/**
 * Runs testing in various modes
 * node test
 * --browser - run testing in browser via webdriver
 * --isolated - run testing in Node.js (V8)
 * --report - create testing report in XUnit format
 * --coverage - create code coverage report
 */

const path = require('path');
const spawn = require('child_process').spawn;
const util = require('./lib/util');
const config = util.getConfig();
const isAmd = config.moduleType === 'amd';
const logger = console;
const LOG_TAG = '[cli]';
const npmScript = require('./lib/npmScript');
const pathTo = require('./lib/util').pathTo;

function runProcess(args) {
   let result,
      proc;

   result = new Promise((resolve, reject) => {
      try {
         logger.log(LOG_TAG, `Running: ${args.join(' ')}`);
         proc = spawn(
            process.execPath,
            args,
            {stdio: 'inherit'}
         );

         proc.on('exit', (code, signal) => {
            resolve({code, signal});
         });
      } catch (err) {
         reject(err);
      }
   });

   Object.defineProperty(result, 'process', {
      get: () => proc
   });

   return result;
}

function pathToScript(name) {
   return path.relative(process.cwd(), path.join(__dirname, name));
}

//Processing CLI arguments to options
let options = {
   jest: false,
   install: false,
   server: false,
   browser: false,
   isolated: false,
   report: false,
   coverage: false,
   config: false,
   configUnits: false,
   emulateBrowser: false,
   selenium: false,
   headless: false
};
let restArgs = [];

process.argv.slice(2).forEach(arg => {
   if (arg.startsWith('--')) {
      let argName = arg.substr(2);
      const [name, value] = argName.split('=', 2);
      if (name in options) {
         options[name] = value === undefined ? true : value;
      } else {
         restArgs.push(arg);
      }
   } else if (arg !== '%NODE_DEBUG_OPTION%') {
      restArgs.push(arg);
   }
});

//Build install CLI arguments
let installArgs = [];
//Build server CLI arguments
let serverArgs = [];
//Build browser CLI arguments
let browserArgs = [];
//Build isolated CLI arguments
let isolatedArgs = [];
//Build jest arguments
let jestArguments = [];

if (options.jest) {
   jestArguments.push(pathToScript('./cli/jest'));
   jestArguments.push(`--config=${options.config || options.configUnits}`);
   jestArguments.push(...restArgs);
} else {
   if (options.install) {
      installArgs.push(pathToScript('./cli/install'));
      installArgs.push(...restArgs);
   }

   if (options.server) {
      serverArgs.push(pathToScript('./cli/server'));
      serverArgs.push(...restArgs);
   }

   if (options.browser) {
      browserArgs.push(
         pathToScript('./queue'),
         pathToScript('./cli/server')
      );

      if (options.head) {
         browserArgs.push('--head');
      }

      if (options.coverage) {
         browserArgs.push('--coverage');
      }
      if (options.config || options.configUnits) {
         browserArgs.push(`--configUnits=${options.config || options.configUnits}`);
      }

      browserArgs.push(pathToScript('./cli/browser'));

      if (options.selenium) {
         browserArgs.push('--selenium');
      }

      if (options.report) {
         browserArgs.push('--report');
      }
      if (options.coverage) {
         browserArgs.push('--coverage');
      }
      if (options.config || options.configUnits) {
         browserArgs.push(`--configUnits=${options.config || options.configUnits}`);
      }

      browserArgs.push(...restArgs);
   }

   if (options.isolated) {
      isolatedArgs.push(pathToScript(options.coverage ? './cover' : './mocha'));

      if (config.timeout) {
         isolatedArgs.push('-t', config.timeout);
      }

      if (options.report) {
         isolatedArgs.push('-R', 'xunit');
      }

      if (isAmd) {
         isolatedArgs.push(pathToScript('./cli/isolated'));
         if (options.emulateBrowser) {
            isolatedArgs.push('--emulateBrowser');
            isolatedArgs.push('--exit');
         }
         if (options.report) {
            isolatedArgs.push('--report');
         }
         if (options.config || options.configUnits) {
            isolatedArgs.push(`--configUnits=${options.config || options.configUnits}`);
         }
      } else {
         isolatedArgs.push(config.tests instanceof Array ? config.tests[0] : config.tests + '/**/*.test.*');
      }

      isolatedArgs.push(...restArgs);
   }
}

//Runs testing child processes
function runProcesses() {
   let processes = [];

   if (jestArguments.length) {
      processes.push(runProcess(jestArguments));
   } else {
      if (serverArgs.length) {
         processes.push(runProcess(serverArgs));
      }
      if (installArgs.length) {
         processes.push(runProcess(installArgs));
      }
      if (browserArgs.length) {
         processes.push(runProcess(browserArgs));
      }
      if (isolatedArgs.length) {
         processes.push(runProcess(isolatedArgs));
      }
   }

   //Translate exit codes
   Promise.all(processes).then(results => {
      let code, signal;
      results.forEach(result => {
         code = code || result.code;
         signal = signal || result.signal;
      });

      process.on('exit', function() {
         if (signal) {
            process.kill(process.pid, signal);
         } else {
            process.exit(code);
         }
      });
   }).catch(logger.error);

   //Terminate children processes on exit
   process.on('SIGINT', () => {
      processes.forEach(item => {
         if (item.process) {
            item.process.kill('SIGINT');
            item.process.kill('SIGTERM');
         }
      });
      process.kill(process.pid, 'SIGINT');
   });
}

//Install nyc if required
if (!options.coverage || pathTo('nyc', false)) {
   runProcesses();
} else {
   logger.log(LOG_TAG, 'Installing nyc');
   npmScript('install-nyc').then(runProcesses).catch((err) => {
      logger.error(LOG_TAG, err);
      process.exit(1);
   });
}

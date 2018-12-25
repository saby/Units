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

function runProcess(args) {
   let result,
      proc;

   result = new Promise((resolve, reject) => {
      try {
         logger.log('Running:', args.join(' '));
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
   install: false,
   server: false,
   browser: false,
   isolated: false,
   report: false,
   coverage: false
};
process.argv.slice(2).forEach(arg => {
   const flag = arg.split('=')[0];

   switch (flag) {
      case '--install':
         options.install = true;
         break;

      case '--browser':
         options.server = true;
         options.browser = true;
         break;

      case '--isolated':
         options.isolated = true;
         break;

      case '--report':
         options.report = true;
         break;

      case '--coverage':
         options.coverage = true;
         break;
   }
});

//Build install CLI arguments
let installArgs = [];
if (options.install) {
   installArgs.push(pathToScript('./cli/install'));
}

//Build browser CLI arguments
let browserArgs = [];
if (options.browser) {
   if (options.server) {
      browserArgs.push(
         pathToScript('./queue'),
         pathToScript('./cli/server')
      );
      if (options.coverage) {
         browserArgs.push('--coverage');
      }
   }

   browserArgs.push(pathToScript('./cli/browser'));
   if (options.report) {
      browserArgs.push('--report');
   }
   if (options.coverage) {
      browserArgs.push('--coverage');
   }
}

//Build isolated CLI arguments
let isolatedArgs = [];
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
      if (options.report) {
         isolatedArgs.push('--report');
      }
   } else {
      isolatedArgs.push(config.tests + '/**/*.test.*');
   }
}

//Run testing child processes
let processes = [];
if (installArgs.length) {
   processes.push(runProcess(installArgs));
}
if (browserArgs.length) {
   processes.push(runProcess(browserArgs));
}
if (isolatedArgs.length) {
   processes.push(runProcess(isolatedArgs));
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

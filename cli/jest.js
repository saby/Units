#!/usr/bin/env node

/**
 * This wrapper runs Jest in valid environment.
 */

const spawn = require('child_process').spawn;
const { getArguments } = require('../lib/jest/command');

const logger = console;
const inputArguments = process.argv.slice(2);
const jestArguments = getArguments(inputArguments);

logger.log(`[jest] Running: ${jestArguments.join(' ')}`);

const proc = spawn(
   process.execPath,
   jestArguments,
   {
      stdio: 'inherit'
   }
);

proc.on('exit', (code, signal) => {
   process.on('exit', function() {
      if (signal) {
         process.kill(process.pid, signal);
      } else {
         process.exit(code);
      }
   });
});

// Terminate children
process.on('SIGINT', () => {
   proc.kill('SIGINT');
   proc.kill('SIGTERM');
   process.kill(process.pid, 'SIGINT');
});

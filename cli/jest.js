#!/usr/bin/env node

/**
 * This wrapper runs Jest in valid environment.
 */

const spawn = require('child_process').spawn;
const { parseArguments } = require('../lib/jest/command');
const runStatics = require('../lib/jest/statics');

const logger = console;
const inputArguments = process.argv.slice(2);
const jestArguments = parseArguments(inputArguments, process.env);


// Максимально возможное время, которое отведено для 1 Jest-процесса.
// Если процесс выходит за отведенное ему время, процесс принудительно завершится.
const HARD_PROCESS_TIMEOUT = 5 * 60 * 1000;

if (jestArguments.parameters.isBrowser) {
   // Необходимо раздать статику
   runStatics(jestArguments.parameters.port);
}

logger.log(`[jest] Running: ${jestArguments.args.join(' ')}`);

const jestProcess = spawn(
   process.execPath,
   jestArguments.args,
   jestArguments.options
);

setTimeout(() => {
   process.kill(jestProcess.pid, 'SIGKILL');
}, HARD_PROCESS_TIMEOUT)

jestProcess.on('exit', (code, signal) => {
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
   jestProcess.kill('SIGINT');
   jestProcess.kill('SIGTERM');
   process.kill(process.pid, 'SIGINT');
});

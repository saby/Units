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

if (jestArguments.parameters.isBrowser) {
   // Необходимо раздать статику
   runStatics(jestArguments.parameters.port, jestArguments.parameters.root);
}

logger.log(`[jest] Running: ${jestArguments.args.join(' ')}`);

const jestProcess = spawn(
   process.execPath,
   jestArguments.args,
   jestArguments.options
);

jestProcess.on('exit', (code, signal) => {
   process.exit(code);
});

// Terminate children
process.on('SIGINT', () => {
   jestProcess.kill('SIGINT');
   jestProcess.kill('SIGTERM');
   process.kill(process.pid, 'SIGINT');
});

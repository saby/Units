#!/usr/bin/env node

/* global require, process */

/**
 * This wrapper runs coverage analysis in valid environment.
 * Usage:
 * node node_modules/ws-unit-testing/cover[ --esm] path/to/your/test/runner.js
 */

let spawn = require('child_process').spawn,
   path = require('path'),
   pathTo = require('./lib/util').pathTo,
   inheritedArgs = process.argv.slice(2),
   args = [
      path.join(pathTo('istanbul'), 'lib', 'cli'),
      'cover',
      path.join(pathTo('mocha'), 'bin', '_mocha')
   ];

let esmFlagAt = inheritedArgs.indexOf('--esm');
if (esmFlagAt > -1) {
   inheritedArgs.splice(esmFlagAt, 1);
   args.push('--compilers', 'js:babel-core/register');
}

args.push.apply(args, inheritedArgs);

console.log('spawn', process.execPath, args);
let proc = spawn(
   process.execPath,
   args,
   {stdio: 'inherit'}
);

proc.on('exit', (code, signal) => {
   if (signal) {
      process.kill(process.pid, signal);
   } else {
      process.exit(0);
   }
});

process.on('exit', () => {
   process.exitCode = 0;
});

// Terminate children on force exit
process.on('SIGINT', () => {
   proc.kill('SIGINT');
   proc.kill('SIGTERM');
   process.kill(process.pid, 'SIGINT');
});

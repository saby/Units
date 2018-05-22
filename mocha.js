#!/usr/bin/env node

/* global require, process */

/**
 * This wrapper runs mocha in valid environment.
 * Usage:
 * node node_modules/ws-unit-testing/mocha -t 10000 -R path/to/your/test/runner.js
 */

let spawn = require('child_process').spawn,
   path = require('path'),
   pathTo = require('./lib/util').pathTo,
   args = [
      //'--experimental-modules',
      //'--loader',
      //'./node_modules/ws-unit-testing/lib/esmLoader.mjs',
      path.join(pathTo('mocha'), 'bin', 'mocha'),
      '--compilers',
      'js:babel-core/register'
   ];

args.push.apply(args, process.argv.slice(2));

let proc = spawn(
   process.execPath,
   args,
   {stdio: 'inherit'}
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

// Terminate children.
process.on('SIGINT', () => {
   proc.kill('SIGINT');
   proc.kill('SIGTERM');
   process.kill(process.pid, 'SIGINT');
});

#!/usr/bin/env node

/**
 * This wrapper runs mocha in valid environment.
 * Usage:
 * node node_modules/ws-unit-testing/mocha -t 10000 -R path/to/your/test/runner.js
 */

var spawn = require('child_process').spawn,
   path = require('path'),
   pathTo = require('./lib/util').node.pathTo,
   args = [
      path.join(pathTo('mocha'), 'bin', 'mocha')
   ];

args.push.apply(args, process.argv.slice(2));

var proc = spawn(
   process.execPath,
   args,
   {stdio: 'inherit'}
);
proc.on('exit', function (code, signal) {
   process.on('exit', function() {
      if (signal) {
         process.kill(process.pid, signal);
      } else {
         process.exit(code);
      }
   });
});

// terminate children.
process.on('SIGINT', function () {
   proc.kill('SIGINT');
   proc.kill('SIGTERM');
   process.kill(process.pid, 'SIGINT');
});

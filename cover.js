#!/usr/bin/env node

/**
 * This wrapper runs coverage analysis in valid environment.
 * Usage:
 * node node_modules/ws-unit-testing/cover path/to/your/test/runner.js
 */

var spawn = require('child_process').spawn,
   path = require('path'),
   fs = require('fs'),
   args = [
      path.join(__dirname, 'node_modules/istanbul/lib/cli'),
      'cover',
      path.join(__dirname, 'node_modules/mocha/bin/_mocha')
   ];

args.push.apply(args, process.argv.slice(2));

var proc = spawn(
   process.execPath,
   args,
   {stdio: 'inherit'}
);

proc.on('exit', function (code, signal) {
   process.on('exit', function(code) {
      code = process.exitCode = 0;
      if (signal) {
         process.kill(process.pid, signal);
      } else {
         process.exit(0);
      }
   });
});

// terminate children.
process.on('SIGINT', function () {
   proc.kill('SIGINT');
   proc.kill('SIGTERM');
   process.kill(process.pid, 'SIGINT');
});

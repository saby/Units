#!/usr/bin/env node

/* global require, process */

/**
 * This wrapper runs mocha in valid environment.
 * Usage:
 * node node_modules/saby-units/mocha[ --amd] -t 10000 -R path/to/your/test/runner.js
 */

let spawn = require('child_process').spawn,
   path = require('path'),
   pathTo = require('./lib/util').pathTo,
   inheritedArgs = process.argv.slice(2),
   args = [path.join(pathTo('mocha'), 'bin', 'mocha')];

let amdFlagAt = inheritedArgs.indexOf('--amd');
if (amdFlagAt === -1) {
   //'--experimental-modules',
   //'--loader',
   //'./node_modules/saby-units/lib/esmLoader.mjs',
   args.push('--compilers', 'es:babel-core/register');
} else {
   inheritedArgs.splice(amdFlagAt, 1);
}

args.push.apply(args, inheritedArgs);

//console.log('spawn', process.execPath, args);
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

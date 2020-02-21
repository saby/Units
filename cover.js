#!/usr/bin/env node

/**
 * This wrapper runs coverage analysis in valid environment.
 * Usage:
 * node node_modules/saby-units/cover[ --amd] path/to/your/test/runner.js
 */

const spawn = require('child_process').spawn;
const path = require('path');
const util = require('./lib/util');
const pathTo = util.pathTo;
const config = util.getConfig();
const inheritedArgs = process.argv.slice(2);
const args = [
   path.join(pathTo('nyc'), 'bin', 'nyc')
];

const amdFlagAt = inheritedArgs.indexOf('--amd');

if (amdFlagAt === -1) {
   //args.push('--require', 'babel-register', '--sourceMap', 'false', '--instrument', 'false');
} else {
   inheritedArgs.splice(amdFlagAt, 1);
}
if (config.nyc) {
   args.push(`-n=${config.nyc.include.join('|')}`);
   args.push(`--report-dir=${config.nyc.reportDir}`);
   args.push('--reporter=html');
}

args.push(path.join(pathTo('mocha'), 'bin', 'mocha'));

args.push.apply(args, inheritedArgs);

const proc = spawn(
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

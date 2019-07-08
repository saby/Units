#!/usr/bin/env node

/**
 * Call scripts in queue (one by one)
 */

let spawn = require('child_process').spawn;
let path = require('path');
let args = process.argv.slice(2);
let processes = [];
let finished = [];

const DELAY = 3000; // Delay between processes run

function finishEarly(index) {
   if (index === undefined) {
      index = processes.length;
   }
   processes.slice(0, index).forEach(proc => {
      proc.kill('SIGINT');
      proc.kill('SIGTERM');
   });
}

function runProcess(command, args, index) {
   args.unshift(command);
   let proc = spawn(
      process.execPath,
      args,
      {stdio: 'inherit'}
   );

   processes.push(proc);

   proc.on('exit', (code, signal) => {
      finished.push({
         script: command,
         index: index,
         code: code,
         signal: signal
      });

      // Finish previous
      finishEarly(index);
   });

   return proc;
}

// Scripts and arguments
let scriptsArgs = [];
let scripts = args.filter((item) => {
   let isArgument = item.startsWith('-');
   if (isArgument) {
      let scriptNum = scriptsArgs.length;
      if (scriptsArgs[scriptNum - 1]) {
         scriptsArgs[scriptNum - 1].push(item);
      }
   } else {
      scriptsArgs.push([]);
   }

   return !isArgument;
});

// Run children through delay
scripts.forEach((script, index) => {
   setTimeout(() => {
      let args = scriptsArgs[index] || [];
      runProcess(path.resolve(script), args, index);
   }, index * DELAY);
});

// Check for max exit code for each finished child
process.on('exit', () => {
   process.exitCode = finished.reduce(
      (code, proc) => Math.max(code, proc.code || 0),
      0
   );
});

// Terminate children on force exit
process.on('SIGINT', () => {
   finishEarly();
   process.kill(process.pid, 'SIGINT');
});

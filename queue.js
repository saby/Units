#!/usr/bin/env node

/**
 * Call scripts in queue (one by one)
 */

let spawn = require('child_process').spawn,
   path = require('path'),
   scripts = process.argv.slice(2),
   processes = [],
   finished = [];

function finishEarly(index) {
   if (index === undefined) {
      index = processes.length;
   }
   processes.slice(0, index).forEach(proc => {
      proc.kill('SIGINT');
      proc.kill('SIGTERM');
   });
}

// Run children
scripts.forEach((script, index) => {
   script = path.resolve(script);
   let proc = spawn(
      process.execPath,
      [script],
      {stdio: 'inherit'}
   );

   processes.push(proc);

   proc.on('exit', (code, signal) => {
      finished.push({
         script: script,
         index: index,
         code: code,
         signal: signal
      });

      // Finish previous
      finishEarly(index);
   });
});

// Check latest finished child
process.on('exit', () => {
   let last = finished.pop();
   if (last) {
      process.exitCode = last.code;
   }
});

// Terminate children on force exit
process.on('SIGINT', () => {
   finishEarly();
   process.kill(process.pid, 'SIGINT');
});

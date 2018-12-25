#!/usr/bin/env node

/**
 * Call scripts in queue (one by one)
 */

let spawn = require('child_process').spawn,
   path = require('path'),
   args = process.argv.slice(2),
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

// Run children
scripts.forEach((script, index) => {
   script = path.resolve(script);
   let args = scriptsArgs[index] || [];
   args.unshift(script);
   let proc = spawn(
      process.execPath,
      args,
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

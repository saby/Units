#!/usr/bin/env node

/**
 * Call scripts in queue (one by one)
 */

let spawn = require('child_process').spawn;
let path = require('path');
let args = process.argv.slice(2);
let processes = [];
let finished = [];

const DELAY = 10000; // Max delay between processes run

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
   return new Promise(function(resolve, reject) {
      args.unshift(command);
      let proc = spawn(
         process.execPath,
         args,
         {stdio: 'inherit'}
      );

      processes.push(proc);

      proc.stdout.on('data', () => {
         resolve(proc);
      });
      proc.stderr.on('data', () => {
         reject(proc);
      });

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

      setTimeout(() => {
         resolve(proc);
      }, DELAY);
   });
}

function runOneByOne(scripts, scriptsArgs, index) {
   let script = scripts[index];
   if (!script) {
      return;
   }
   let args = scriptsArgs[index] || [];
   runProcess(path.resolve(script), args, index).then(() => {
      runOneByOne(scripts, scriptsArgs, 1 + index);
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

// Run scripts one by one
runOneByOne(scripts, scriptsArgs, 0);

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

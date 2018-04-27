let spawn = require('child_process').spawn,
   path = require('path');

const isWindows = /^win/.test(process.platform);

/**
 * Runs an npm script
 * @param {String} name Script name
 * @param {Function} callback
 */
module.exports = function(name, callback) {
   let proc = spawn(
      isWindows ? 'npm.cmd' : 'npm',
      ['run-script', name],
      {stdio: 'inherit', cwd: path.resolve(path.join(__dirname, '..'))}
   );

   proc.on('exit', (code, signal) => {
      callback && callback(code, signal);
   });

   process.on('SIGINT', () => {
      proc.kill('SIGINT');
      proc.kill('SIGTERM');
   });

   return proc;
};

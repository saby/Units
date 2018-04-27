let spawn = require('child_process').spawn,
   path = require('path');

const isWindows = /^win/.test(process.platform);

/**
 * Runs an npm script
 * @param {String} name Script name
 * @returns {Promise}
 */
module.exports = function(name) {
   return new Promise((resolve, reject) => {
      try {
         let proc = spawn(
            isWindows ? 'npm.cmd' : 'npm',
            ['run-script', name], {
               stdio: 'inherit',
               cwd: path.resolve(path.join(__dirname, '..'))
            }
         );

         proc.on('exit', (code, signal) => {
            if (code) {
               reject(new Error(`Process exited with code ${code}`));
            } else {
               resolve(code, signal);
            }
         });

         process.on('SIGINT', () => {
            proc.kill('SIGINT');
            proc.kill('SIGTERM');
         });
      } catch (err) {
         reject(err);
      }
   });
};

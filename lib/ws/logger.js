/**
 * Console logger implementation.
 */

let extend = require('./extend');

const logger = console;

class Logger {
   log(tag, message) {
      logger.log(`[LOG] ${tag}': ${message}`);
   }

   warn(tag, message) {
      logger.warn(`[WARNING] ${tag}: ${message}`);
   }

   error(tag, message, exception) {
      logger.error(`[ERROR] ${tag}: ${message}${(exception && exception.stack ? ': ' + exception.stack : (exception ? ': ' + String(exception) : ''))}`);
   }

   info(tag, message) {
      logger.info(`[INFO] ${tag}: ${message}`);
   }
}

exports.Logger = Logger;

/**
 * Setups console logger
 */
function setup(requirejs) {
   if (requirejs.defined('Env/Env')) {
      const Env = requirejs('Env/Env');
      const IoC = Env.IoC;
      const ILogger = Env.ILogger;

      extend(Logger, ILogger);
      IoC.bindSingle('ILogger', new Logger());
   }
}

exports.setup = setup;

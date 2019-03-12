/**
 * Console logger implementation.
 */

let extend = require('./extend');

const logger = console;

class Logger {
   log(tag, message) {
      logger.log(`${tag}': ${message}`);
   }

   warn(tag, message) {
      logger.warn(`${tag}: ${message}`);
   }

   error(tag, message, exception) {
      logger.error(`${tag}: ${message}${(exception && exception.stack ? ': ' + exception.stack : (exception ? ': ' + String(exception) : ''))}`);
   }

   info(tag, message) {
      logger.info(`${tag}: ${message}`);
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

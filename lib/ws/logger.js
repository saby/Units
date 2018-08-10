/**
 * Console logger implementation.
 */

let extend = require('./extend');

const logger = console;

class Logger extends Object {
   log(tag, message) {
      logger.log(`${tag}': ${message}`);
   }

   warn(tag, message) {
      logger.warn(`${tag}: ${message}`);
   }

   error(tag, message, exception) {
      logger.error(`${tag}: ${message}` + (exception ? exception.toString() : ''));
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
   let ioc = requirejs('Core/IoC'),
      ILogger = requirejs('Core/ILogger');

   extend(Logger, ILogger);

   ioc.bindSingle('ILogger', new Logger());
}

exports.setup = setup;

/**
 * Console logger implementation.
 */
const logger = console;

class Logger extends Object {
   log(tag, message) {
      logger.log(`${tag}': ${message}`);
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
   let classicExtend = requirejs('Core/core-functions').classicExtend,
      ioc = requirejs('Core/IoC'),
      ILogger = requirejs('Core/ILogger');

   classicExtend(Logger, ILogger);

   ioc.bindSingle('ILogger', new Logger());
}

exports.setup = setup;

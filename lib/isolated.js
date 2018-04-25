/* global global */

/**
 * Прогоняет unit тесты в изолированной среде (Node.js).
 */

let path = require('path'),
   sysfs = require('fs'),
   unit = require('./unit'),
   report = unit.report;

const logger = console;

class TestConsoleLogger extends Object {
   log(tag, message) {
      logger.log(tag + ': ' + message);
   }

   error(tag, message, exception) {
      logger.error(tag + ': ' + message + (exception ? exception.toString() : ''));
   }

   info(tag, message) {
      logger.info(tag + ': ' + message);
   }
}

function prepareEnvironment(requirejs, wsRootPath, resourcesPath) {
   global.isMochaRunned = true;
   global.assert = require('chai').assert;
   global.sinon = require('sinon');
   global.requirejs = requirejs;
   global.define = requirejs.define;
   global.wsConfig = {
      wsRoot: wsRootPath,
      resourceRoot: resourcesPath,
      nostyle: true,
      globalConfigSupport: false
   };
}

function loadContents(projectRootPath, resourcesPath) {
   let contentsPath = path.resolve(
      path.join(projectRootPath, resourcesPath, 'contents.json')
   );

   let result;
   if (sysfs.existsSync(contentsPath)) {
      result = require(contentsPath);
   }

   return result;
}

function setupRequireJs(requirejs, configPath, projectRootPath, wsRootPath, resourcesPath, contents) {
   let config = require(configPath)(
      projectRootPath,
      wsRootPath,
      resourcesPath,
      contents
   );
   config.nodeRequire = require;

   requirejs.config(config);
}

function setupJsModules(contents, requirejs, resourcesPath) {
   if (contents && contents.jsModules) {
      let constants = requirejs('Core/constants');
      constants.jsModules = constants.jsModules || {};
      Object.keys(contents.jsModules).forEach(module => {
         let modulePath = path.join(
            resourcesPath,
            contents.jsModules[module]
         );
         constants.jsModules[module] = (resourcesPath ? '/' : '') + modulePath;
      });
   }
}

function setupLogger(requirejs) {
   let classicExtend = requirejs('Core/core-functions').classicExtend,
      ioc = requirejs('Core/IoC'),
      ILogger = requirejs('Core/ILogger');

   classicExtend(TestConsoleLogger, ILogger);

   //Подменяем штатный логгер
   ioc.bindSingle('ILogger', new TestConsoleLogger());
}

function saveReport(initialFileName) {
   report.setFileName(initialFileName);

   //Удаляем старый отчет
   report.clear();

   let fileName = report.getFilename();
   logger.log('Writing report file "' + fileName + '"');

   //Перехватываем вывод для формирования отчета
   let writeOriginal = process.stdout.write,
      output = [];

   process.stdout.write = chunk => {
      let str = '' + chunk;
      if (str && str[0] !== '<') {
         str = '<!--' + str + '-->';
      }
      output.push(str);
   };

   process.on('exit', () => {
      process.stdout.write = writeOriginal;
      report.save(output.join(''));
   });

}

/**
 * Запускает тестирование
 * @param {Object} config Конфигурация тестирования
 */
exports.run = function(config) {
   let projectRootPath = config.root || '',
      wsRootPath = path.join(config.ws, 'ws/'),
      resourcesPath = config.resources,
      testsPath = config.tests,
      requirejsPath = path.resolve(path.join(projectRootPath, wsRootPath, 'ext/requirejs/r.js')),
      requirejsConfigPath = path.resolve(path.join(projectRootPath, wsRootPath, 'ext/requirejs/config.js'));

   //Load r.js from WS if possible
   if (!sysfs.existsSync(requirejsPath)) {
      //Otherwise use npm package
      requirejsPath = 'requirejs';
   }
   let requirejs = require(requirejsPath);

   //Подготавливаем окружение для ядра
   prepareEnvironment(requirejs, wsRootPath, resourcesPath);

   //Загружаем оглавление
   let contents = loadContents(projectRootPath, resourcesPath);

   //Настраиваем requirejs
   setupRequireJs(requirejs, requirejsConfigPath, projectRootPath, wsRootPath, resourcesPath, contents);

   try {
      //Подключаем ядро
      requirejs(path.join(wsRootPath, 'lib/core.js'));

      //Подключаем логер
      setupLogger(requirejs);
   } catch (err) {
      if (err.originalError) {
         logger.error('Core initialization failed: ' + err);
      }
      throw (err.originalError || err);
   }

   //Строим пути оглавления относительно каталога ресурсов
   setupJsModules(contents, requirejs, resourcesPath);

   //Запускаем тесты
   let hasErrors = false;
   unit.test.getList(
      path.join(projectRootPath, testsPath)
   ).forEach(test => {
      try {
         requirejs(test);
      } catch (err) {
         logger.error('Module "' + test + '" failed with error: ' + err);
         logger.error(err.originalError || err);
         hasErrors = true;
      }
   });

   if (config.reportFile) {
      saveReport(config.reportFile);
   }

   process.on('exit', code => {
      if (hasErrors) {
         process.exitCode = code = 1;
      }
   });
};

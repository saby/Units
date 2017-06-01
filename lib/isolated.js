/* global global */

/**
 * Прогоняет unit тесты в изолированной среде (Node.js).
 */

var path = require('path'),
   sysfs = require('fs'),
   requirejs = require('requirejs'),
   unit = require('./unit'),
   report = unit.report;

/**
 * Запускает тестирование
 * @param {Object} config Конфигурация тестирования
 */
exports.run = function (config) {
   var projectRootPath = config.root || '',
      //isAbsolute = path.resolve(projectRootPath) === projectRootPath,
      wsRootPath = path.join(config.ws, 'ws/'),
      wsResourcesPath = config.resources,
      testsPath = config.tests;

   //Подготавливаем окружение для ядра
   global.isMochaRunned = true;
   global.assert = require('chai').assert;
   global.sinon = require('sinon');
   global.requirejs = requirejs;
   global.define = requirejs.define;
   global.wsConfig = {
      wsRoot: wsRootPath,
      resourceRoot: wsResourcesPath,
      nostyle: true,
      globalConfigSupport: false
   };

   //Настраиваем requirejs
   var requirejsCfg = require(
      path.resolve(
         path.join(projectRootPath, wsRootPath, 'ext/requirejs/config.js')
      )
   )(
      projectRootPath,
      wsRootPath,
      wsResourcesPath
   );
   requirejsCfg.nodeRequire = require;

   try {
      requirejs.config(requirejsCfg);
      //Подключаем ядро
      requirejs(path.join(wsRootPath, 'lib/core.js'));

      //Подключаем модули
      var classicExtend = requirejs('Core/core-functions').classicExtend,
         ioc = requirejs('Core/IoC');
      ILogger = requirejs('Core/ILogger'),
         TestConsoleLogger = function () {
            this.log = function(tag, message) {
               console.log(tag + ': ' + message);
            };

            this.error = function(tag, message, exception) {
               console.error(tag + ': ' + message + (exception ? exception.toString() : ''));
            };

            this.info = function(tag, message) {
               console.info(tag + ': ' + message);
            };
         };
      classicExtend(TestConsoleLogger, ILogger);

      //Подменяем штатный логгер
      ioc.bindSingle('ILogger', new TestConsoleLogger());

      //Загружаем оглавление
      var constants = requirejs('Core/constants'),
         contentsPath = path.resolve(
            path.join(projectRootPath, wsResourcesPath, 'contents.json')
         ),
         contents;

      if (sysfs.existsSync(contentsPath)) {
         contents = require(contentsPath);
      }
   } catch (e) {
      if (e.originalError) {
         console.error('Core initialization failed: ' + e);
      }
      throw (e.originalError || e);
   }

   //Строим пути оглавления относительно каталога ресурсов
   if (contents && contents.jsModules) {
      constants.jsModules = constants.jsModules || {};
      Object.keys(contents.jsModules).forEach(function(module) {
         var modulePath = path.join(
            wsResourcesPath,
            contents.jsModules[module]
         );
         constants.jsModules[module] = (wsResourcesPath ? '/' : '') + modulePath;
      });
   }

   //Запускаем тесты
   var hasErrors = false;
   unit.test.getList(
      path.join(projectRootPath, testsPath)
   ).forEach(function (test) {
      try {
         requirejs(test);
      } catch (e) {
         console.error('Module "' + test + '" failed with error: ' + e);
         console.error(e.originalError || e);
         hasErrors = true;
      }
   });

   if (config.reportFile) {
      report.setFileName(config.reportFile);

      //Удаляем старый отчет
      report.clear();

      var fileName = report.getFilename();
      console.log('Writing report file "' + fileName + '"');

      //Перехватываем вывод для формирования отчета
      var writeOriginal = process.stdout.write,
         output = [];
      process.stdout.write = function (chunk) {
         var str = '' + chunk;
         if (str && str[0] !== '<') {
            str = '<!--' + str + '-->';
         }
         output.push(str);
      };

      process.on('exit', function () {
         process.stdout.write = writeOriginal;
         report.save(output.join(''));
      });
   }

   process.on('exit', function (code) {
      if (hasErrors) {
         process.exitCode = code = 1;
      }
   });
};

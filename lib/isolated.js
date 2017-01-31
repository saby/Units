/**
 * Прогоняет unit тесты в изолированной среде (Node.js).
 */

var global = (0, eval)('this'),
   path = require('path'),
   requirejs = require('requirejs'),
   unit = require('./unit'),
   report = unit.report;

/**
 * Запускает тестирование
 * @param {Object} config Конфигурация тестирования
 */
exports.run = function (config) {
   config.root = process.cwd();
   config.ws = 'WS.Core';
   config.resources = 'WS.Data/';
   config.tests = 'test/';

   var rootPath = config.root || '',
      wsConfig = {
         wsRoot: config.ws + '/ws/',
         resourceRoot: config.resources,
         nostyle: true,
         globalConfigSupport: false
      };

   //Подготавливаем окружение для ядра
   global.isMochaRunned = true;
   global.requirejs = requirejs;
   global.define = requirejs.define;
   global.assert = require('chai').assert;
   global.wsConfig = wsConfig;

   //Настраиваем requirejs
   var requireCfg = require(
         path.resolve(
            path.join(rootPath, wsConfig.wsRoot, 'ext/requirejs/config.js')
         )
      )(
      rootPath,
      wsConfig.wsRoot,
      wsConfig.resourceRoot
   );
   requireCfg.nodeRequire = require;
   requirejs.config(requireCfg);

   //Подключаем ядро
   requirejs(path.join(rootPath, wsConfig.wsRoot, 'lib/core.js'));

   //Подменяем штатный логгер
   $ws.proto.TestConsoleLogger = function () {
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

   $ws.core.classicExtend($ws.proto.TestConsoleLogger, $ws.proto.ILogger);
   $ws.single.ioc.bindSingle('ILogger', new $ws.proto.TestConsoleLogger());

   //Загружаем оглавление
   var contents = require(
      path.resolve(
         path.join(rootPath, wsConfig.resourceRoot, 'contents.json')
      )
   );
   $ws.core.loadContents(contents, false, {
      service: rootPath,
      resources: wsConfig.resourceRoot
   });

   //Запускаем тесты
   unit.test.getList(path.join(rootPath, config.tests)).forEach(function (test) {
      try {
         requirejs(test);
      } catch (e) {
         console.log('Test "' + test + '" throws an error:');
         console.log(e);
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
};

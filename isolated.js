#!/usr/bin/env node

/**
 * Запускает тестирование в Node.js
 * @param {Object} config Конфигурация: {
 *    ws: 'Путь до WS',
 *    [resources]: 'Путь до ресурсов',
 *    [tests] 'Путь до тестов (относительно каталога ресурсов)',
 *    [reportFile]: 'Путь к файлу отчета'
 * }
 */
exports.run = function (config) {
   if (arguments.length === 3 || arguments.length === 4) {
      config = {
         ws: arguments[0],
         resources: arguments[1],
         tests: arguments[2],
         reportFile: arguments[3]
      };
   }

   config = config || {};
   config.root = config.root || '';
   config.ws = config.ws || '';
   config.resources = config.resources || '';
   config.tests = config.tests || config.resources;
   config.reportFile = config.reportFile || '';

   require('./lib/isolated').run(config);
};

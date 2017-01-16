#!/usr/bin/env node

/**
 * Запускает тестирование в Node.js
 * @param {String} ws Путь до WS
 * @param {String} resources Путь до ресурсов
 * @param {String} tests Путь до тестов (относительно каталога ресурсов)
 * @param {String} [report=''] Путь к файлу отчета
 */
exports.run = function (ws, resources, tests, report) {
   var config = {
      ws: ws,
      resources: resources,
      tests: tests,
      reportFile: report
   };
   require('./lib/isolated').run(config);
};

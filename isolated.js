#!/usr/bin/env node

var config = require('./etc/config');

/**
 * Запускает тестирование в Node.js
 * @param {String} ws Путь до WS
 * @param {String} resources Путь до ресурсов
 * @param {String} tests Путь до тестов (относительно каталога ресурсов)
 */
exports.run = function (ws, resources, tests) {
   config.ws = ws;
   config.resources = resources;
   config.tests = tests;
   /*
      "root": "./",
      "tests": "test",
      "ws": "WS.Core/ws",
      "resources": "WS.Data",
     */

   require('./lib/isolated').run(config);
};

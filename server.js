#!/usr/bin/env node

var path = require('path'),
   connect = require('connect'),
   http = require('http'),
   serveStatic = require('serve-static'),
   handlers = require('./lib/server-handlers');

/**
 * Запускает HTTP сервер для тестирования в браузере.
 *
 * @typedef {Object} Config
 * @property {String} ws Путь до WS (например, 'ws')
 * @property {String} [resources] Путь до каталога ресурсов (например, 'resources')
 * @property {String} [tests] Путь до тестов (например, 'tests')
 * @property {Array.<String>} [shared] Дополнительные каталоги и файлы, содержимое которых должно быть доступно через сервер (например, ['doc'])
 * @property {String} [initializer] Путь до скрипта инициализации (например, 'init.js')
 *
 * @param {Number} port Порт
 * @param {Config} config Конфигурация
 */
exports.run = function (port, config) {
   if (arguments.length === 4) {
      config = {
         ws: arguments[0],
         resources: arguments[1],
         tests: arguments[2]
      };
      port = arguments[3];
   }

   config = config || {};
   config.root = config.root || '';
   config.ws = config.ws || '';
   config.wsPath = path.join(config.root, config.ws);
   config.resources = config.resources || '';
   config.resourcesPath = path.join(config.root, config.resources);
   config.tests = config.tests || config.resources;
   config.testsPath = path.join(config.root, config.tests);
   config.shared = config.shared || [];
   config.initializer = config.initializer || 'testing-init.js';

   console.log('Starting unit testing HTTP server at port ' + port + ' for "' + config.resourcesPath + '"');

   var shutDown = function() {
         if (server) {
            console.log('Stopping unit testing HTTP server at port ' + port + ' for "' + config.resourcesPath + '"');
            server.close();
         }
         server = null;
      },
      app = connect(),
      server;

   app
      .use('/~setup.js', handlers.setup(config))
      .use('/~test-list.js', handlers.testList(config))
      .use('/~ws/', serveStatic(config.wsPath))
      .use('/~tests/' + config.tests, serveStatic(config.testsPath))
      .use('/~resources/', serveStatic(config.resourcesPath))
      .use('/node_modules/', serveStatic(path.join(process.cwd(), 'node_modules')));

   config.shared.forEach(function(dir) {
      app.use('/' + dir, serveStatic(path.join(config.root, dir)));
   });

   app
      .use(serveStatic(__dirname))
      .use(serveStatic(process.cwd()));

   server = http.createServer(app).listen(port);

   process.on('exit', function() {
      shutDown();
   });

   process.on('SIGINT', function () {
      shutDown();
      process.kill(process.pid, 'SIGINT');
   });
};

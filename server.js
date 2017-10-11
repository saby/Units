#!/usr/bin/env node

var path = require('path'),
   connect = require('connect'),
   http = require('http'),
   serveStatic = require('serve-static'),
   testList = require('./lib/unit').test;

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
   config.resources = config.resources || '';
   config.tests = config.tests || config.resources;
   config.shared = config.shared || [];
   config.initializer = config.initializer || 'testing-init.js';

   var resourcesPath = path.join(config.root, config.resources),
      wsPath = path.join(config.root, config.ws),
      testsPath = path.join(config.root, config.tests);

   console.log('Starting unit testing HTTP server at port ' + port + ' for "' + resourcesPath + '"');

   var shutDown = function() {
         if (server) {
            console.log('Stopping unit testing HTTP server at port ' + port + ' for "' + resourcesPath + '"');
            server.close();
         }
         server = null;
      },
      app = connect(),
      server;

   app
      .use('/~test-list.js', function (req, res) {
         var list = testList.buildFile(
            config.tests,
            '~tests/'
         );
         res.end(list);
      })
      .use('/~index.js', serveStatic(path.join(process.cwd(), config.initializer)))
      .use('/~index.js', serveStatic(path.join(__dirname, 'index.js')))
      .use('/~ws/', serveStatic(wsPath))
      .use('/~tests/' + config.tests, serveStatic(testsPath))
      .use('/~resources/', serveStatic(resourcesPath))
      .use('/node_modules/', serveStatic(path.join(process.cwd(), 'node_modules')));

   config.shared.forEach(function(dir) {
      app.use('/' + dir, serveStatic(path.join(config.root, dir)));
   });

   app
      .use(serveStatic(__dirname))
      .use(serveStatic(process.cwd()));

   server = http.createServer(app)
      .listen(port);

   process.on('exit', function() {
      shutDown();
   });

   process.on('SIGINT', function () {
      shutDown();
      process.kill(process.pid, 'SIGINT');
   });
};

#!/usr/bin/env node

var path = require('path'),
   connect = require('connect'),
   http = require('http'),
   serveStatic = require('serve-static'),
   testList = require('./lib/unit').test;

/**
 * Запускает HTTP сервер для тестирования в браузере
 * @param {Number} port Порт
 * @param {Object} config Конфигурация: {
 *    ws: 'Путь до WS',
 *    [resources]: 'Путь до ресурсов',
 *    [tests]: 'Путь до тестов (относительно каталога ресурсов)',
 *    [initializer]: 'Путь до скрипта инициализации'
 * }
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
   config.ws = config.ws || '';
   config.resources = config.resources || '';
   config.tests = config.tests || config.resources;
   config.initializer = config.initializer || 'testing-init.js';

   console.log('Starting unit testing HTTP server at port ' + port + ' for "' + config.resources + '"');

   var shutDown = function() {
         if (server) {
            console.log('Stopping unit testing HTTP server at port ' + port + ' for "' + config.resources + '"');
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
            '~resources/'
         );
         res.end(list);
      })
      .use('/~index.js', serveStatic(path.join(process.cwd(), config.initializer)))
      .use('/~index.js', serveStatic(path.join(__dirname, 'index.js')))
      .use('/~ws/', serveStatic(config.ws))
      .use('/~resources/', serveStatic(config.resources))
      .use('/node_modules/', serveStatic(path.join(process.cwd(), 'node_modules')))
      .use(serveStatic(__dirname));

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

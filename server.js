#!/usr/bin/env node

var path = require('path'),
   connect = require('connect'),
   http = require('http'),
   serveStatic = require('serve-static'),
   testList = require('./lib/unit').test;

/**
 * Запускает HTTP сервер для тестирования в браузере
 * @param {String} ws Путь до WS
 * @param {String} resources Путь до ресурсов
 * @param {String} tests Путь до тестов (относительно каталога ресурсов)
 * @param {Number} port Порт
 */
exports.run = function (ws, resources, tests, port) {
   console.log('Starting unit testing HTTP server at port ' + port + ' for "' + resources + '"');

   var shutDown = function() {
         if (server) {
            console.log('Stopping unit testing HTTP server at port ' + port + ' for "' + resources + '"');
            server.close();
         }
         server = null;
      },
      app = connect(),
      server;

   app
      .use('/~test-list.js', function (req, res) {
         var list = testList.buildFile(
            tests,
            '~resources/'
         );
         res.end(list);
      })
      .use('/~ws', serveStatic(ws))
      .use('/~resources', serveStatic(resources))
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

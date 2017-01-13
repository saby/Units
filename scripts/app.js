#!/usr/bin/env node

/**
 * Запускает локальный http сервер
 */

var path = require('path'),
   connect = require('connect'),
   http = require('http'),
   serveStatic = require('serve-static'),
   config = require('../config'),
   testList = require('../lib/unit').test;

/**
 * Запускает http-сервер со страницей тестирования
 * @param {Number} port Порт
 * @param {String} ws Путь до WS
 * @param {String} resources Путь до ресурсов
 */
exports.run = function (port, ws, resources) {
   console.info('Starting unit testing HTTP server at port ' + port + ' for "' + resources + '"');

   app = connect();
   app
      .use('/~test-list.js', function (req, res) {
         var list = testList.buildFile(
            path.join(config.root, config.tests),
            '~resources/'
         );
         res.end(list);
      })
      /*.use('/testing', function (req, res, next) {
         return resourcesStatic(req, res, next);
      })*/
      .use('/~ws', serveStatic(ws))
      .use('/~resources', serveStatic(resources))
      .use(serveStatic(path.join(__dirname, '../')));

   http
      .createServer(app)
      .listen(port);
};

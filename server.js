#!/usr/bin/env node

let path = require('path'),
   connect = require('connect'),
   http = require('http'),
   serveStatic = require('serve-static'),
   handlers = require('./lib/server-handlers');

const logger = console;

/**
 * Запускает HTTP сервер для тестирования в браузере.
 *
 * @typedef {Object} Config
 * @property {String} ws Путь до WS (например, 'ws')
 * @property {String} [resources] Путь до каталога ресурсов (например, 'resources')
 * @property {String} [tests] Путь до тестов (например, 'tests')
 * @property {String} [coverageCommand] Команда, запускающая генерацию отчета о покрытии (например, 'node node_modules/ws-unit-testing/cover test-isolated')
 * @property {String} [coverageReport] Команда, запускающая генерацию отчета о покрытии (например, '/artifacts/coverage/lcov-report/index.html')
 * @property {Array.<String>} [shared] Дополнительные каталоги и файлы, содержимое которых должно быть доступно через сервер (например, ['doc'])
 * @property {String} [initializer] Путь до скрипта инициализации (например, 'init.js')
 *
 * @param {Number} port Порт
 * @param {Config} config Конфигурация
 */
exports.run = function(port, config) {
   config = config || {};
   config.root = config.root || '';
   config.ws = config.ws || '';
   config.wsPath = path.join(config.root, config.ws);
   config.resources = config.resources || '';
   config.resourcesPath = path.join(config.root, config.resources);
   config.tests = config.tests || config.resources;
   config.testsPath = path.join(config.root, config.tests);
   config.coverageCommand = config.coverageCommand || 'node node_modules/ws-unit-testing/cover test';
   config.coverageReport = config.coverageReport || '/artifacts/coverage/';
   config.shared = config.shared || [];
   config.initializer = config.initializer || 'testing-init.js';

   logger.log('Starting unit testing HTTP server at port ' + port + ' for "' + config.resourcesPath + '"');

   let app = connect(),
      server;

   let shutDown = function() {
      if (server) {
         logger.log('Stopping unit testing HTTP server at port ' + port + ' for "' + config.resourcesPath + '"');
         server.close();
      }
      server = null;
   };

   app
      .use('/~setup.js', handlers.setup(config))
      .use('/~test-list.js', handlers.testListAmd(config))
      .use('/~test-list.json', handlers.testListJson(config))
      .use('/~coverage/', handlers.coverage(config))
      .use('/~ws/', serveStatic(config.wsPath))
      .use('/~resources/', serveStatic(config.resourcesPath))
      .use('/cdn/', serveStatic(path.join(config.wsPath, 'ws/lib/Ext')))
      .use('/node_modules/', serveStatic(path.join(process.cwd(), 'node_modules')));

   config.shared.forEach(dir => {
      app.use('/' + dir, serveStatic(path.join(config.root, dir)));
   });

   app
      .use(serveStatic(__dirname))
      .use(serveStatic(process.cwd()));

   server = http.createServer(app).listen(port);

   process.on('exit', shutDown);

   process.on('SIGINT', () => {
      shutDown();
      process.kill(process.pid, 'SIGINT');
   });
};

#!/usr/bin/env node

/* global require, process */

let path = require('path'),
   connect = require('connect'),
   http = require('http'),
   serveStatic = require('serve-static'),
   package = require('./package.json'),
   handlers = require('./lib/handlers');

const logger = console;

/**
 * Runs HTTP server which generates HTML page with testing
 *
 * @param {Number} port Server port
 * @param {Config} config Config
 * @param {String} [config.moduleType='esm'] Testing module type: 'esm' - ECMAScript Module, 'amd' - Asynchronous Module Definition
 * @param {String} config.ws Path to WS (for example, 'ws')
 * @param {String} [config.resources] Path to resources folder (for example, 'resources')
 * @param {String} [config.tests] Path to tests folder (for example, 'tests')
 * @param {String} [config.initializer] Path to initialzation script that calls before testing start (for example, 'init.js')
 * @param {Array.<String>} [config.shared] Additional shared files and folders via HTTP (for example, ['doc'])
 * @param {String} [config.coverageCommand] Command that runs coverage HTML report building (for example, 'node node_modules/ws-unit-testing/cover test-isolated')
 * @param {String} [config.coverageReport] Coverage HTML report target path (например, '/artifacts/coverage/lcov-report/index.html')
 */
exports.run = function(port, config) {
   config = config || {};
   config.moduleType = config.moduleType || 'esm';
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

   const mimeTypes = package.mimeTypes || {};
   const serverSignature = `"${package.description}" HTTP server v.${package.version} at port ${port} for "${config.resourcesPath}"`;

   logger.log(`Starting ${serverSignature}`);

   let staticConfig = {
      setHeaders: function setHeaders(res, path) {
         let dotPos = path.lastIndexOf('.');
         if (dotPos > -1) {
            let ext = path.substr(dotPos + 1);
            if (ext in mimeTypes) {
               res.setHeader('Content-Type', mimeTypes[ext]);
            }
         }
      }
   };

   let app = connect()
      .use('/~setup.js', handlers.setup(config))
      .use('/~test-list.js', handlers.testListAmd(config))
      .use('/~test-list.json', handlers.testListJson(config))
      .use('/~coverage/', handlers.coverage(config))
      .use('/~ws/', serveStatic(config.wsPath, staticConfig))
      .use('/~resources/', serveStatic(config.resourcesPath, staticConfig))
      .use('/cdn/', serveStatic(path.join(config.wsPath, 'ws/lib/Ext'), staticConfig))
      .use('/node_modules/', serveStatic(path.join(process.cwd(), 'node_modules')));

   config.shared.forEach(dir => {
      app.use('/' + dir, serveStatic(path.join(config.root, dir)));
   });

   app
      .use(serveStatic(__dirname, staticConfig))
      .use(serveStatic(process.cwd(), staticConfig));

   let server = http.createServer(app).listen(port);

   let shutDown = function() {
      if (server) {
         logger.log(`Stopping ${serverSignature}`);
         server.close();
      }
      server = null;
   };

   process.on('exit', shutDown);

   process.on('SIGINT', () => {
      shutDown();
      process.kill(process.pid, 'SIGINT');
   });
};

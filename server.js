#!/usr/bin/env node

/* global require, process */

let path = require('path');
let connect = require('connect');
let http = require('http');
let serveStatic = require('serve-static');
let package = require('./package.json');
let {WS_CORE_PATH} = require('./lib/constants');
let handlers = require('./lib/handlers');

const logger = console;

/**
 * Runs HTTP server which generates HTML page with testing
 *
 * @param {Number} port Server port
 * @param {Config} config Config
 * @param {String} [config.moduleType='esm'] Testing module type: 'esm' - ECMAScript Module, 'amd' - Asynchronous Module Definition
 * @param {String} [config.root=''] Path to the project root
 * @param {String} [config.tests] Path to tests folder (relative to config.root)
 * @param {String} [config.initializer] Path to initialzation script that calls before testing start (for example, 'init.js')
 * @param {Array.<String>} [config.shared] Additional shared files and folders via HTTP (for example, ['doc'])
 * @param {String} [config.coverageCommand] Command that runs coverage HTML report building (for example, 'node node_modules/ws-unit-testing/cover test-isolated')
 * @param {String} [config.coverageReport] Coverage HTML report target path (например, '/artifacts/coverage/lcov-report/index.html')
 */
exports.run = function(port, config) {
   config = config || {};
   config.moduleType = config.moduleType || 'esm';
   config.root = config.root || '';
   config.tests = config.tests || '';
   config.coverageCommand = config.coverageCommand || 'node node_modules/ws-unit-testing/cover test';
   config.coverageReport = config.coverageReport || '/artifacts/coverage/';
   config.shared = config.shared || [];
   config.initializer = config.initializer || '';

   const mimeTypes = package.mimeTypes || {};
   const serverSignature = `"${package.description}" HTTP server v.${package.version} at port ${port} for "${config.root}"`;

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

   const CDN_PATH = path.join(path.join(config.root, WS_CORE_PATH), 'ws/lib/Ext');

   let app = connect()
      .use(serveStatic(__dirname, staticConfig))
      .use(serveStatic(config.root ? config.root : process.cwd(), staticConfig))
      .use('/node_modules/', serveStatic(path.join(process.cwd(), 'node_modules'), staticConfig))
      .use('/cdn/', serveStatic(CDN_PATH, staticConfig))
      .use('/~setup.js', handlers.setup(config))
      .use('/~test-list.js', handlers.testListAmd(config))
      .use('/~test-list.json', handlers.testListJson(config))
      .use('/~coverage/', handlers.coverage(config));

   config.shared.forEach(dir => {
      app.use('/' + dir, serveStatic(path.join(config.root, dir)));
   });

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

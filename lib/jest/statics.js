const path = require('path');
const url = require('url');
const fs = require('fs');
const connect = require('connect');
const http = require('http');
const serveStatic = require('serve-static');
const logger = console;
const LOGGER_PREFIX = '[jest]';
const EMPTY_PAGE = '<!DOCTYPE html>';

function run(port, rootDir) {
   const defaultHandler = serveStatic(rootDir);
   const app = connect()
      .use((request, response, next) => {
         const requestUrl = url.parse(request.url);
         let requestPath = requestUrl.pathname;
         if (requestPath.startsWith('/')) {
            requestPath = requestPath.substr(1);
         }
         if (!requestPath) {
            response.end(EMPTY_PAGE);
            return;
         }
         const fileName = path.join(rootDir, requestPath);
         const fileExists = fs.existsSync(fileName);
         if (!fileExists) {
            return defaultHandler(request, response, next);
         }
         const fileData = fs.readFileSync(fileName);
         response.end(fileData);
      });
   let server = http.createServer(app).listen(port, () => {
      logger.log(`${LOGGER_PREFIX} Starting static server at port ${port} with rootDir "${rootDir}"`);
   });
   const shutDown = function(code) {
      if (server && code === 0) {
         logger.log(`${LOGGER_PREFIX} Stopping static server at port ${port}`);
         server.close();
      }
      server = null;
   };
   process.on('exit', shutDown);
}

module.exports = run;

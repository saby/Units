const connect = require('connect');
const http = require('http');
const logger = console;

function run(port) {
   const app = connect()
      .use((request, response, next) => {
         console.log(`REQUEST URL=${request.url}, METHOD=${request.method}`);
         response.end('test');
      });
   let server = http.createServer(app).listen(port, () => {
      logger.log(`Starting static server at port ${port}`);
   });
   let shutDown = function(code) {
      if (server && code === 0) {
         logger.log(`Stopping static server at port ${port}`);
         server.close();
      }
      server = null;
   };
   process.on('exit', shutDown);
}

module.exports = run;

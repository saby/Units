/**
 * HTTP-server handlers
 */

var fs = require('fs'),
   path = require('path'),
   spawn = require('child_process').spawn,
   testList = require('./unit').test,
   template = require('./template'),
   onError = function(e, res) {
      console.error(e);
      res.statusCode = 500;
      res.statusMessage = 'Internal server error';
      res.end(e.toString());
   };

module.exports = {
   //Generate setup script
   setup: function(config) {
      return function (req, res) {
         try {
            var setupTemplate = fs.readFileSync(path.join(__dirname, 'setup.template.js')),
               contentsScriptName = path.join(config.resourcesPath, 'contents.js'),
               contentsScriptLoad = 'false',
               postScriptName = path.join(process.cwd(), config.initializer),
               postScriptText = '';

            if (fs.existsSync(contentsScriptName)) {
               contentsScriptLoad = 'true';
            }

            if (fs.existsSync(postScriptName)) {
               postScriptText = fs.readFileSync(postScriptName);
            }

            res.setHeader('Content-Type', 'application/javascript');
            res.end(template(setupTemplate, {
               WS_CONTENTS_LOAD: contentsScriptLoad,
               POST_SCRIPTS: postScriptText
            }));
         } catch (e) {
            onError(e, res);
         }
      };
   },

   //Generate tests list
   testList: function(config) {
      return function (req, res) {
         try {
            var list = testList.buildFile(
               config.tests,
               '~tests/'
            );
            res.end(list);
         } catch (e) {
            onError(e, res);
         }
      };
   },
   
   //Generate coverage report
   coverage: function(config) {
      return function (req, res) {
         try {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.write('<html>');
            res.write('<title>Code coverage report</title>');
            res.write('<style type="text/css">');
            res.write('* {margin: 0; padding: 0;}');
            res.write('#log {display: none; height: 100%;}');
            res.write('#log:last-child {display: block;}');
            res.write('pre {background-color: #fff; border: 1px dashed #999; min-height: 100%; margin: 10px; overflow: auto; padding: 10px;}');
            res.write('iframe {border: none; height: 100%; width: 100%;}');
            res.write('</style>');
            res.write('<div id="log"><pre>');

            var args = config.coverageCommand.split(' ')
               proc = spawn(
                 args[0],
                 args.slice(1),
                 {cwd: process.cwd()}
               ),
               buffer = [];

            proc.stdout.on('data', function(data) {
               res.write(data);
               //buffer.push(data);
            });

            proc.stderr.on('data', function(data) {
               res.write(data);
               //buffer.push(data);
            });

            proc.on('close', function(code) {
               //res.writeHead(302, {Location: config.coverageReport});
               //res.end(buffer.join('\n'));
               res.write('</pre></div>');
               res.write('<iframe src="' + config.coverageReport + '"/>');
               res.write('</html>');
               res.end();
            });

            proc.on('error', function(e) {
               //res.write(buffer.join('\n'));
               onError(e, res);
            });
         } catch (e) {
            onError(e, res);
         }
      };
   }
};

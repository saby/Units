/**
 * HTTP-server handlers
 */

let fs = require('fs'),
   path = require('path'),
   spawn = require('child_process').spawn,
   testList = require('./unit').test,
   template = require('./template'),
   package = require('../package.json');

const logger = console;

function onError(err, res) {
   logger.error(err);
   res.statusCode = 500;
   res.statusMessage = 'Internal server error';
   res.end(err.toString());
}

//Generate setup script
function setup(config) {
   return (req, res) => {
      try {
         let setupTemplate = fs.readFileSync(path.join(__dirname, 'setup.tjs')),
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
            VERSION: package.version,
            TITLE: package.description,
            WS_CONTENTS_LOAD: contentsScriptLoad,
            POST_SCRIPTS: postScriptText
         }));
      } catch (err) {
         onError(err, res);
      }
   };
}

//Generate tests list
function getTestList(config) {
   return (req, res) => {
      try {
         let list = testList.buildFile(
            config.tests,
            ''
         );
         res.end(list);
      } catch (err) {
         onError(err, res);
      }
   };
}

//Generate coverage report
function generateCoverage(config) {
   return (req, res) => {
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

         let args = config.coverageCommand.split(' '),
            proc = spawn(
               args[0],
               args.slice(1),
               {cwd: process.cwd()}
            );

         //let buffer = [];

         proc.stdout.on('data', data => {
            res.write(data);

            //buffer.push(data);
         });

         proc.stderr.on('data', data => {
            res.write(data);

            //buffer.push(data);
         });

         proc.on('close', () => {
            //res.writeHead(302, {Location: config.coverageReport});
            //res.end(buffer.join('\n'));
            res.write('</pre></div>');
            res.write('<iframe src="' + config.coverageReport + '"/>');
            res.write('</html>');
            res.end();
         });

         proc.on('error', err => {
            //res.write(buffer.join('\n'));
            onError(err, res);
         });
      } catch (err) {
         onError(err, res);
      }
   };
}

module.exports = {
   setup: setup,
   testList: getTestList,
   coverage: generateCoverage
};

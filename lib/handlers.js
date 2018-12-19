/**
 * HTTP-server handlers
 */

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const serveStatic = require('serve-static');
const Nyc = require('nyc');
const mime = require('mime')
const testList = require('./unit').test;
const template = require('./template');
const pckg = require('../package.json');
const nycConfig = require(path.join(process.cwd(), 'package.json'))['nyc'] || {};

const logger = console;

function onError(err, res) {
   logger.error(err);
   res.statusCode = 500;
   res.statusMessage = 'Internal server error';
   res.end(err.toString());
}

function staticFiles(config, staticConfig) {
   const ROOT = config.root ? config.root : process.cwd();
   const defaultHandler = serveStatic(ROOT, staticConfig);

   const nyc = new Nyc(nycConfig);
   const instrumenter = nyc.instrumenter();
   const transformer = instrumenter.instrumentSync.bind(instrumenter);

   return (req, res, next) => {
      if (!config.coverage) {
         return defaultHandler(req, res, next);
      }

      try {
         let fileName = path.join(ROOT, req.originalUrl);
         let fileExists = fs.existsSync(fileName);
         if (!fileExists) {
            return defaultHandler(req, res, next);
         }

         let fileData = fs.readFileSync(fileName);

         if (nyc.exclude.shouldInstrument(fileName)) {
            fileData = transformer(String(fileData), fileName);
         }

         var type = mime.lookup(fileName)
         if (type) {
            var charset = mime.charsets.lookup(type);
            res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
         }

         res.end(fileData);
      } catch (err) {
         onError(err, res);
      }
   };
}

//Generate setup script
function setup(config) {
   return (req, res) => {
      try {
         let setupTemplate = fs.readFileSync(path.join(__dirname, 'setup.tjs')),
            contentsScriptName = path.join(config.root, 'contents.js'),
            contentsScriptLoad = false,
            postScriptName = config.initializer ? path.join(process.cwd(), config.initializer) : '',
            postScriptText = '';

         if (fs.existsSync(contentsScriptName)) {
            contentsScriptLoad = true;
         }

         if (postScriptName && fs.existsSync(postScriptName)) {
            postScriptText = fs.readFileSync(postScriptName);
         }

         res.setHeader('Content-Type', 'application/javascript');
         res.end(template(setupTemplate, {
            TITLE: pckg.description,
            VERSION: pckg.version,
            MODULE_TYPE: config.moduleType,
            WS: config.ws,
            WS_CONTENTS_LOAD: contentsScriptLoad,
            POST_SCRIPTS: postScriptText
         }));
      } catch (err) {
         onError(err, res);
      }
   };
}

//Generate tests list as AMD
function getTestListAmd(config) {
   return (req, res) => {
      try {
         let list = testList.amdfyList(
            config.root,
            testList.getList(path.join(config.root, config.tests))
         );
         res.end('define(' + JSON.stringify(list) + ');');
      } catch (err) {
         onError(err, res);
      }
   };
}

//Generate tests list as JSON
function getTestListJson(config) {
   return (req, res) => {
      try {
         let list = testList.amdfyList(
            config.root,
            testList.getList(path.join(config.root, config.tests))
         );
         res.end(JSON.stringify(list));
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
   staticFiles: staticFiles,
   setup: setup,
   testListAmd: getTestListAmd,
   testListJson: getTestListJson,
   coverage: generateCoverage
};

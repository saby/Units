/**
 * HTTP-server handlers
 */

const fs = require('fs');
const path = require('path');
const url = require('url');
const spawn = require('child_process').spawn;
const serveStatic = require('serve-static');
const mime = require('mime');
const pathTo = require('./util').pathTo;
const testList = require('./unit').test;
const template = require('./template');
const pckg = require('../package.json');
const {
   getRequireJsPath,
   getRequireJsConfigPath,
   getWsConfig,
   isWsAppExists
} = require('./ws/wsConfig');
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

   //Remove root folder prefix from include rules
   if (nycConfig.include instanceof Array) {
      nycConfig.include = nycConfig.include.map((value) => {
         if (String(value).startsWith(ROOT)) {
            value = value.substr(ROOT.length);
            if (value.startsWith('/')) {
               value = value.substr(1);
            }
         }
         return value;
      });
   }

   const hasNyc = !!pathTo('nyc', false);
   const Nyc = hasNyc ? require('nyc') : null;
   const nyc = hasNyc ? new Nyc(nycConfig) : null;
   const instrumenter = hasNyc ? nyc.instrumenter() : null;
   const transformer = hasNyc ? instrumenter.instrumentSync.bind(instrumenter) : null;

   return (req, res, next) => {
      if (!config.coverage) {
         return defaultHandler(req, res, next);
      }

      try {
         let requestUrl = url.parse(req.url);
         let requestPath = requestUrl.pathname;
         if (requestPath.startsWith('/')) {
            requestPath = requestPath.substr(1);
         }
         let fileName = path.join(ROOT, requestPath);
         let fileExists = fs.existsSync(fileName);
         if (!fileExists) {
            return defaultHandler(req, res, next);
         }

         let fileData = fs.readFileSync(fileName);

         if (nyc && nyc.exclude.shouldInstrument(requestPath)) {
            try {
               fileData = transformer(String(fileData), requestPath);
            } catch (err) {
               logger.error(`Cannot transform "${fileName}" because of error. `, err);
            }
         }

         let type = mime.getType(fileName);
         if (type) {
            res.setHeader('Content-Type', type);
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
         let setupTemplate = fs.readFileSync(path.join(__dirname, 'setup.tjs'));
         let contentsScriptName = path.join(config.root, 'contents.js');
         let contentsScriptLoad = fs.existsSync(contentsScriptName);
         let postScriptName = config.initializer ? path.join(process.cwd(), config.initializer) : '';
         let postScriptText = '';

         if (postScriptName && fs.existsSync(postScriptName)) {
            postScriptText = fs.readFileSync(postScriptName);
         }

         res.setHeader('Content-Type', 'application/javascript');

         const startupScripts = [];
         if (config.moduleType === 'amd' && contentsScriptLoad) {
            startupScripts.push('contents.js');
         }

         let wsConfig = getWsConfig(config.root, {
            wsPath: config.ws
         });

         if (config.moduleType === 'amd') {
            startupScripts.push(getRequireJsPath(config.root, true, false));

            let requireJsConfigPath = getRequireJsConfigPath(config.root);
            if (requireJsConfigPath) {
               startupScripts.push(requireJsConfigPath);
            }
         }

         res.end(template(setupTemplate, {
            TITLE: pckg.description,
            VERSION: pckg.version,
            MODULE_TYPE: config.moduleType,
            DEPENDENCIES: config.dependencies || [],
            WS_CONFIG: JSON.stringify(wsConfig, null, 3),
            WS: config.ws,
            WS_APP_EXISTS: isWsAppExists(config.root),
            STARTUP_SCIPTS: JSON.stringify(startupScripts),
            CDN: config.cdn,
            POST_SCRIPTS: postScriptText,
            CHECK_LEAKS: config.ignoreLeaks ? 'ignore' : 'check'
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
            testList.getList(config.root, config.tests)
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
            testList.getList(config.root, config.tests)
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
   staticFiles,
   setup,
   testListAmd: getTestListAmd,
   testListJson: getTestListJson,
   coverage: generateCoverage
};

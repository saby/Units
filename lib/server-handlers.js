/**
 * HTTP-server handlers
 */

var fs = require('fs'),
   path = require('path'),
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
               postScriptName = path.join(process.cwd(), config.initializer),
               postScriptText = '';

            if (fs.existsSync(postScriptName)) {
               postScriptText = fs.readFileSync(postScriptName);
            }

            res.setHeader('Content-Type', 'application/javascript');
            res.end(template(setupTemplate, {
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
   }
};

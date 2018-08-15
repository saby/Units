//Testing setup
var testing = {
   //Run testing
   run: function() {
      this.runLoad(this.runMocha);
   },

   //Load testing code
   runLoad: function(callback) {
      requirejs(['Core/core'], function () {
         requirejs(
            ['~test-list'],
            callback,
            testing.logException);
      }, testing.logException)
   },

   //Init testing
   init: function() {
      this.initMocha();
      this.initWs();
   },

   //Mocha setup
   initMocha: function() {
      mocha.setup({
         ui: 'bdd',
         reporter: function(runner) {
            var query = typeof window === 'undefined' ? '?reporter=XUnit' : window.location.search,
               result = query.match(new RegExp('[?&]reporter=([^&]*)&?$')),
               reporterCode = result ? result[1] : 'HTML';

            if (reporterCode === 'JSCoverage') {
                reporterCode = 'HTML';
                runner.on('end', function () {
                    var domElement = document.createElement('textarea');
                    domElement.setAttribute('id', 'report');
                    domElement.setAttribute('readonly', 'readonly');
                    domElement.value = JSON.stringify(window.__coverage__);

                    document.getElementsByTagName('body')[0].appendChild(domElement);
                });
            }

            if (!(reporterCode in Mocha.reporters)) {
               throw new Error('Reporter "' + reporterCode + '" is undefined.');
            }
            var reporter = new Mocha.reporters[reporterCode](runner, {});

            if (reporterCode === 'XUnit') {
               //Change XUnit output stream
               var buffer = [];
               reporter.write = function(line) {
                  buffer.push(line);
               };
               runner.on('end', function () {
                  var domElement = document.createElement('textarea');
                  domElement.setAttribute('id', 'report');
                  domElement.setAttribute('readonly', 'readonly');
                  domElement.value = buffer.join('\n');
                  document.getElementsByTagName('body')[0].appendChild(domElement);
                  buffer.length = 0;
               });
            }
         }
      });

      window.assert = chai.assert;

      this.configureMocha();
   },

   //Mocha configuration setup
   configureMocha: function() {
      mocha.checkLeaks();
   },

   //Run Mocha testing
   runMocha: function () {
      mocha.run(testing.successMocha);
   },

   //After Mocha testing
   successMocha: function () {
      document.getElementsByTagName('body')[0].className += ' tests-finished';
   },

   //WS setup
   initWs: function() {
      window.wsConfig = this.getWsConfig();
   },

   //WS config getter
   getWsConfig: function() {
      return {
         wsRoot: '~ws/ws/',
         cdnRoot: '~ws/ws/lib/Ext/',
         resourceRoot: '~resources/',
         nostyle: true,
         globalConfigSupport: false
      };
   },

   wsLoadContents: /*[WS_CONTENTS_LOAD]*/,

   //Script include
   loadScript: function(url, callback) {
      var script = document.createElement('script'),
         startNode = document.getElementById('testing-init');
      script.setAttribute('src', url);
      if (callback) {
          script.onload = callback;
      }
      startNode.parentNode.insertBefore(script, startNode);
   },

   //Exceptions logger
   logException: function(exception) {
      var node = document.getElementById('exception');
      if (!node) {
         node = document.createElement('div');
         node.setAttribute('id', 'exception');
         document.getElementsByTagName('body')[0].appendChild(node);
      }

      console.error(exception);
      node.textContent += exception.stack || exception;
   }
};

/*[POST_SCRIPTS]*/

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
      if (this.wsLoadContents) {
         this.loadScript('~resources/contents.js');
      }
   },

   //Mocha setup
   initMocha: function() {
      mocha.setup({
         ui: 'bdd',
         reporter: function (runner) {
            var query = typeof window === 'undefined' ? '?reporter=XUnit' : window.location.search,
               result = query.match(new RegExp("[?&]reporter=([^&]*)&?$")),
               reporterCode = result ? result[1] : 'HTML';

            if (!(reporterCode in Mocha.reporters)) {
               throw new Error('Reporter "' + reporterCode + '" is undefined.');
            }
            var reporter = new Mocha.reporters[reporterCode](runner, {});

            if (reporterCode == 'XUnit') {
               //Change XUnit output stream
               reporter.buffer = [];
               reporter.domElement = $('<div/>')
                  .attr('id', 'report')
                  .appendTo('body');
               reporter.write = function (line) {
                  this.buffer.push(line);
                  this.domElement.html(this.buffer.join("\n"));
               };
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
   loadScript: function(url) {
      var script = document.createElement('script'),
         startNode = document.getElementById('testing-init');
      script.setAttribute('src', url);
      startNode.parentNode.insertBefore(script, startNode);
   },

   //Exceptions logger
   logException: function(exception) {
      var node = $('#exception');
      if (!node.length) {
         node = $('<pre/>')
            .attr('id', 'exception')
            .appendTo('body');
      }
      console.error(exception);
      node.html(node.html() + (exception.stack || exception));
   }
};

/*[POST_SCRIPTS]*/

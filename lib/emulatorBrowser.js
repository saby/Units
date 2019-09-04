const jsdom = require('jsdom-global');
let emulator;

function start() {
   if (!emulator) {
      emulator = jsdom();
      initGlobalVariable('SVGElement', function SVGElement() {} );
   }
}

function close() {
   if (emulator) {
      emulator();
      global.SVGElement = global.jQuery = global.$ = emulator = undefined;
   }
}

function initGlobalVariable(name, value) {
   global[name] = window[name] = value;
}

module.exports = {
   start,
   close,
   initGlobalVariable
};

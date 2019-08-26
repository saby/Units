const jsdom = require('jsdom-global');
let emulator;

function start() {
   emulator = jsdom();
}

function close() {
   emulator();
   emulator = undefined;
}

function initializationGlobalVariable(name, value) {
   global[name] = window[name] = value;
}

module.exports = {
   start,
   close,
   initializationGlobalVariable
};

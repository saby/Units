const emulator = require('./../emulatorBrowser');

module.exports = function() {
   const jquery = requirejs('cdn/JQuery/jquery/3.3.1/jquery-min.js');
   const constance = requirejs('Env/Env').constants;

   emulator.initGlobalVariable('$', jquery);
   emulator.initGlobalVariable('jQuery', jquery);

   constance.isServerSide = false;
};

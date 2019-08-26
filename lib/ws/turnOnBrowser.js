const emulator = require('./../emulatorBrowser');

export function turnOnBrowser() {
   const jquery = requirejs('cdn/JQuery/jquery/3.3.1/jquery-min.js');
   const constance = requirejs('Env/Env').constants;

   emulator.initializationGlobalVariable('$', jquery);
   emulator.initializationGlobalVariable('jQuery', jquery);

   constance.isNodePlatform = false;
   constance.isServerScript = false;
   constance.isNode = false;
};

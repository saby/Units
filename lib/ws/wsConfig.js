let {WS_CORE_PATH} = require('./../constants');

module.exports = function(options) {
  return {
     debug: true,
     appRoot: options.appPath === undefined ? '' : options.appPath,
     resourceRoot: options.resourcePath === undefined ? '/' : options.resourcePath,
     wsRoot: options.wsPath || WS_CORE_PATH,
     loadCss: options.loadCss === undefined ? true : options.loadCss,
     showAlertOnTimeoutInBrowser: false,
  };
};

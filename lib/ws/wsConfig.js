let {WS_CORE_PATH} = require('./../constants');

module.exports = function(options) {
  return {
     wsRoot: options.wsPath || WS_CORE_PATH,
     showAlertOnTimeoutInBrowser: false,
     resourceRoot: options.resourcePath === undefined ? '/' : options.resourcePath,
     appRoot: options.appPath === undefined ? '' : options.appPath,
     loadCss: options.loadCss === undefined ? true : options.loadCss
  };
};

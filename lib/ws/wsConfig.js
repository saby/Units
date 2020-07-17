const fs = require('fs');
const path = require('path');

const WS_NAME = 'WS.Core';

function isWsExists(appRoot) {
  return fs.existsSync(path.join(appRoot, `${WS_NAME}/${WS_NAME}.s3mod`));
}

function getWsConfig(appRoot, options) {
  if (options.appPath === undefined) {
    options.appPath = '';
  }
  if (options.resourcePath === undefined) {
    options.resourcePath = '/';
  }
  if (options.loadCss === undefined) {
    options.loadCss = true;
  }

  if (!options.wsPath && isWsExists(appRoot)) {
    options.wsPath = WS_NAME;
  }

  return {
     debug: true,
     appRoot: options.appPath,
     resourceRoot: options.resourcePath,
     wsRoot: options.wsPath,
     loadCss: options.loadCss,
     showAlertOnTimeoutInBrowser: false
  };
};

module.exports =  {isWsExists, getWsConfig};

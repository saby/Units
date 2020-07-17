const fs = require('fs');
const path = require('path');

const WS_NAME = 'WS.Core';

function isWsExists(appRoot) {
  return fs.existsSync(path.join(appRoot, `${WS_NAME}/${WS_NAME}.s3mod`));
}

function getWsConfig(appRoot, options) {
  const actiualOptions = {...options};

  if (actiualOptions.appPath === undefined) {
    actiualOptions.appPath = '';
  }
  if (actiualOptions.resourcePath === undefined) {
    actiualOptions.resourcePath = '/';
  }
  if (actiualOptions.loadCss === undefined) {
    actiualOptions.loadCss = true;
  }

  if (!actiualOptions.wsPath && isWsExists(appRoot)) {
    actiualOptions.wsPath = WS_NAME;
  }

  return {
     debug: true,
     appRoot: actiualOptions.appPath,
     resourceRoot: actiualOptions.resourcePath,
     wsRoot: actiualOptions.wsPath,
     loadCss: actiualOptions.loadCss,
     showAlertOnTimeoutInBrowser: false
  };
};

module.exports =  {isWsExists, getWsConfig};

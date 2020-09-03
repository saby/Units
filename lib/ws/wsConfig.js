const fs = require('fs');
const path = require('path');

const WS_NAME = 'WS.Core';
const REQUIREJS_LOADER_MODULE = 'RequireJsLoader';
const WS_APP_NAME = 'Application';

function isWsExists(appRoot) {
  return fs.existsSync(path.join(appRoot, `${WS_NAME}/${WS_NAME}.s3mod`));
}

function isWsAppExists(appRoot) {
  return fs.existsSync(path.join(appRoot, `${WS_APP_NAME}/${WS_APP_NAME}.s3mod`));
}

function getRequireJsLoaderPath(appRoot) {
  const moduleExists = fs.existsSync(path.join(appRoot, REQUIREJS_LOADER_MODULE, REQUIREJS_LOADER_MODULE + '.s3mod'));
  return moduleExists ? REQUIREJS_LOADER_MODULE : '';
}

function getRequireJsPath(appRoot, forBrowser, patched) {
  if (forBrowser) {
    const loaderPath = getRequireJsLoaderPath(appRoot);
    return loaderPath ? `${loaderPath}/require.js` : 'node_modules/requirejs/require.js';
  }

  return patched ? path.resolve(__dirname, '../requirejs/r.js') : 'requirejs';
}

function getRequireJsConfigPath(appRoot) {
  const loaderPath = getRequireJsLoaderPath(appRoot);
  return loaderPath ? `${loaderPath}/config.js` : '';
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

module.exports =  {
  getRequireJsPath,
  getRequireJsConfigPath,
  isWsAppExists,
  getWsConfig
};

const path = require('path');
const { existsSync } = require('fs');
const { getWsConfig, getRequireJsPath, getRequireJsConfigPath } = require('../ws/wsConfig');
const setupLogger = require('../ws/logger').setup;
const loadContents = require('../ws/loadContents');
const setupRequireJs = require('../ws/setup').requireJs;

const requirejsPath = getRequireJsPath(SABY_ENV.PROJECT_ROOT_PATH, false, true);
const requirejs = require(requirejsPath);
const contents = loadContents(SABY_ENV.PROJECT_ROOT_PATH);

try {
   // Setup RequireJS
   const configPath = getRequireJsConfigPath(SABY_ENV.PROJECT_ROOT_PATH);
   if (configPath) {
      const requirejsConfigPath = path.resolve(path.join(SABY_ENV.PROJECT_ROOT_PATH, configPath));
      setupRequireJs(requirejs, requirejsConfigPath, SABY_ENV.PROJECT_ROOT_PATH, [], wsConfig.wsRoot, contents);
   }

   // Setup logger
   setupLogger(requirejs);
} catch (error) {
   throw (error.originalError || error);
}

let AppInit;
if (existsSync(path.join(SABY_ENV.PROJECT_ROOT_PATH, 'Application/Application.s3mod'))) {
   const isInitialized = requirejs.defined('Application/Initializer');
   AppInit = requirejs('Application/Initializer');
   if (!isInitialized) {
      AppInit.default();
   }
   // создаем новый Request для каждого test-case
   const fakeReq = { };
   const fakeRes = { };
   AppInit.startRequest(void 0, void 0, () => fakeReq, () => fakeRes);
}

global.contents = contents;
global.requirejs = requirejs;
global.define = requirejs.define;

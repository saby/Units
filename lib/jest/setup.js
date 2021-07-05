const path = require('path');
const { existsSync } = require('fs');
const setupRequireJs = require('../ws/setup').requireJs;
const setupLogger = require('../ws/logger').setup;
const loadContents = require('../ws/loadContents');
const { getWsConfig, getRequireJsConfigPath } = require('../ws/wsConfig');

const requirejsPath = path.resolve(__dirname, './require.js');
const requirejs = require(requirejsPath);

const wsConfig = getWsConfig(__SABY_APPLICATION_DIRECTORY__, {
   resourcePath: './',
   wsPath: '',
   appPath: __SABY_APPLICATION_DIRECTORY__ + '/',
   loadCss: __SABY_LOAD_CSS__,
   debug: __SABY_DEBUG_MODE__
});

const contents = loadContents(__SABY_APPLICATION_DIRECTORY__);
global.wsConfig = wsConfig;

try {
   // Setup RequireJS
   const configPath = getRequireJsConfigPath(__SABY_APPLICATION_DIRECTORY__);
   if (configPath) {
      const requirejsConfigPath = path.resolve(path.join(__SABY_APPLICATION_DIRECTORY__, configPath));
      setupRequireJs(requirejs, requirejsConfigPath, __SABY_APPLICATION_DIRECTORY__, [], wsConfig.wsRoot, contents);
   }

   // Setup logger
   setupLogger(requirejs);
} catch (error) {
   throw (error.originalError || error);
}

let AppInit;
if (existsSync(path.join(__SABY_APPLICATION_DIRECTORY__, 'Application/Application.s3mod'))) {
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

if (existsSync(path.join(__SABY_APPLICATION_DIRECTORY__, 'Env/Env.s3mod'))) {
   const Env = requirejs('Env/Env');
   Object.assign(Env.constants, contents);
}

/* Compatibility with Mocha */
global.before = global.beforeAll;
global.after = global.afterAll;

global.assert = require('chai').assert;
global.sinon = require('sinon');
global.jsdom = require('jsdom');

/*
* Проблема:
* С глобально объявленным define неправильно загружаются umd-модули из node_modules,
* загрузка которых происходит через нодовский require.
*/
requirejs.define.amd = false;

global.define = requirejs.define;
global.requirejs = requirejs;
global.wsConfig = wsConfig;

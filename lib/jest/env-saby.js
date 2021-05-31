const chai = require('chai');
const sinon = require('sinon');
const jsdom = require('jsdom');
const path = require('path');
const { existsSync } = require('fs');
const setupRequireJs = require('../ws/setup').requireJs;
const setupLogger = require('../ws/logger').setup;
const loadContents = require('../ws/loadContents');
const { getWsConfig, getRequireJsPath, getRequireJsConfigPath } = require('../ws/wsConfig');

function initializeEnvironment(environment, config) {
   const requirejsPath = getRequireJsPath(config.projectRootPath, false, true);
   const requirejs = require(requirejsPath);

   const wsConfig = getWsConfig(config.projectRootPath, {
      resourcePath: config.resourcePath,
      wsPath: config.wsPath,
      appPath: config.projectRootPath,
      loadCss: config.loadCss,
      debug: config.debug
   });
   global.wsConfig = wsConfig;

   const contents = loadContents(config.projectRootPath);
   try {
      // Setup RequireJS
      const configPath = getRequireJsConfigPath(config.projectRootPath);
      if (configPath) {
         const requirejsConfigPath = path.resolve(path.join(config.projectRootPath, configPath));
         setupRequireJs(requirejs, requirejsConfigPath, config.projectRootPath, [], wsConfig.wsRoot, contents);
      }

      // Setup logger
      setupLogger(requirejs);
   } catch (error) {
      throw (error.originalError || error);
   }

   let AppInit;
   if (existsSync(path.join(config.projectRootPath, 'Application/Application.s3mod'))) {
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

   environment.global.requirejs = requirejs;
   environment.global.define = requirejs.define;
   environment.global.wsConfig = wsConfig;
   environment.global.assert = chai.assert;
   environment.global.sinon = sinon;
   environment.global.jsdom = jsdom;
}

function installGlobals(environment) {
   global.describe = environment.global.describe;
   global.it = environment.global.it;
   global.before = environment.global.beforeAll;
   global.after = environment.global.afterAll;
   global.beforeEach = environment.global.beforeEach;
   global.afterEach = environment.global.afterEach;
   global.assert = environment.global.assert;
   global.wsConfig = environment.global.wsConfig;
   global.sinon = environment.global.sinon;
   global.jsdom = environment.global.jsdom;
   global.document = environment.global.document;
   global.window = environment.global.window;
   global.Node = environment.global.Node;
   global.expect = environment.global.expect;
}

function removeFileExtension(path) {
   return path.slice(0, path.lastIndexOf('.'));
}

function findUIModulePath(roots, fullPath) {
   for (let index = 0; index < roots.length; ++index) {
      const root = roots[index];
      if (!fullPath.startsWith(root)) {
         continue;
      }
      const startIndex = root.lastIndexOf(path.sep);
      return removeFileExtension(fullPath.slice(startIndex + 1));
   }
}

function prepareUIModulePath(config, fullPath) {
   const testModule = findUIModulePath(config.roots, fullPath);
   if (testModule) {
      return testModule;
   }
   const uiModule = findUIModulePath(config.moduleDirectories, fullPath);
   if (uiModule) {
      return uiModule;
   }
   return fullPath;
}

module.exports = {
   initializeEnvironment,
   installGlobals,
   prepareUIModulePath
};

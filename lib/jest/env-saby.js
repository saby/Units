const chai = require('chai');
const sinon = require('sinon');
const jsdom = require('jsdom');
const path = require('path');
const vm = require('vm');
const fs = require('fs-extra');
const { existsSync } = require('fs');

const setupRequireJs = require('../ws/setup').requireJs;
const setupLogger = require('../ws/logger').setup;
const loadContents = require('../ws/loadContents');
const { getWsConfig, getRequireJsPath, getRequireJsConfigPath } = require('../ws/wsConfig');

function setupGlobals(environment, config) {
   const wsConfig = getWsConfig(config.projectRootPath, {
      resourcePath: './',
      wsPath: '',
      appPath: config.projectRootPath + '/',
      loadCss: config.loadCss,
      debug: config.debug
   });

   environment.global.wsConfig = wsConfig;
   environment.global.assert = chai.assert;
   environment.global.sinon = sinon;
   environment.global.jsdom = jsdom;

   environment.global.SABY_ENV = {
      PROJECT_ROOT_PATH: config.projectRootPath
   };
}

async function getSetupScript() {
   const fileName = 'env-init.js';
   const sourceTextPath = path.join(__dirname, fileName);
   const sourceText = await fs.readFile(sourceTextPath, 'utf-8');
   return new vm.Script(sourceText, {
      fileName
   });
}

module.exports = {
   getSetupScript
};

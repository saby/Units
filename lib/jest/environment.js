const NodeEnvironment = require('jest-environment-node');
const chai = require('chai');
const sinon = require('sinon');
const jsdom = require('jsdom');
const path = require('path');
const { existsSync } = require('fs');
const setupRequireJs = require('../ws/setup').requireJs;
const setupLogger = require('../ws/logger').setup;
const loadContents = require('../ws/loadContents');
const { getWsConfig, getRequireJsPath, getRequireJsConfigPath } = require('../ws/wsConfig');

class Environment extends NodeEnvironment {
    constructor(config, context) {
        super(config);
        this.testPath = context.testPath;
    }

    async setup() {
        await super.setup();
        this.initializeEnvironment();
    }

    async teardown() {
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }

    initializeEnvironment() {
        const projectRootPath = 'application';
        const requirejsPath = getRequireJsPath(projectRootPath, false, true);
        const requirejs = require(requirejsPath);

        const wsConfig = getWsConfig(projectRootPath, {
            resourcePath: './',
            wsPath: '',
            appPath: projectRootPath,
            loadCss: false
        });

        // prepareEnvironment
        this.global.assert = chai.assert;
        this.global.sinon = sinon;
        this.global.jsdom = jsdom;
        this.global.requirejs = requirejs;
        this.global.define = requirejs.define;
        this.global.wsConfig = wsConfig;

        const contents = loadContents(projectRootPath);
        try {
            // Setup RequireJS
            const configPath = getRequireJsConfigPath(projectRootPath);
            if (configPath) {
                const requirejsConfigPath = path.resolve(path.join(projectRootPath, configPath));
                setupRequireJs(requirejs, requirejsConfigPath, projectRootPath, [], wsConfig.wsRoot, contents);
            }

            // Setup logger
            setupLogger(requirejs);
        } catch (error) {
            throw (error.originalError || error);
        }

        let AppInit;
        if (existsSync(path.join(projectRootPath, 'Application/Application.s3mod'))) {
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
    }
}

module.exports = Environment;
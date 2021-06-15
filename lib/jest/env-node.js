const NodeEnvironment = require('jest-environment-node');
const SabyEnvironment = require('./env-saby');

class Environment extends NodeEnvironment {
   constructor(config, context) {
      super(config);
      this.testPath = context.testPath;
      this.config = config;
   }

   async setup() {
      await super.setup();
      SabyEnvironment.initializeEnvironment(this, {
         projectRootPath: this.config.rootDir,
         loadCss: false,
         debug: true
      });
   }
}

module.exports = Environment;

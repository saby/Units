const JSDOMEnvironment = require('jest-environment-jsdom');
const SabyEnvironment = require('./env-saby');

class Environment extends JSDOMEnvironment {
   constructor(config, context) {
      super(config);
      this.testPath = context.testPath;
      this.config = config;
   }

   async setup() {
      const cfg = {
         projectRootPath: this.config.rootDir,
         loadCss: true,
         debug: true
      };
      await super.setup();

      // Setup saby global variables
      SabyEnvironment.setupGlobals(this, cfg);

      // Initialize saby environment
      const script = await SabyEnvironment.getSetupScript(this);
      this.runScript(script);
   }
}

module.exports = Environment;

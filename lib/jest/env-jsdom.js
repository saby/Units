const JSDOMEnvironment = require('jest-environment-jsdom');
const SabyEnvironment = require('./env-saby');

const HTML_PAGE = `
<!DOCTYPE html>
<html>
    <head></head>
    <body></body>
</html>
`;

class Environment extends JSDOMEnvironment {
   constructor(config, context) {
      super(config);
      this.testPath = context.testPath;
      this.config = config;
   }

   async setup() {
      await super.setup();
      SabyEnvironment.initializeEnvironment(this, {
         projectRootPath: this.config.rootDir,
         loadCss: true,
         debug: true
      });
   }
}

module.exports = Environment;

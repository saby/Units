# Unit testing in WaSaby environment

## Introduction
It's based on [Mocha](https://mochajs.org/) and [Chai](http://chaijs.com/). [Sinon](http://sinonjs.org/) is also included.

There are some global functions which available in test cases: `describe`, `it` and many more from Mocha's [BDD interface](https://mochajs.org/#-u---ui-name).

You can include `assert` method like in [this example](assert.js).

All test cases should be named by mask `*.test.js`. For example, `test/example.test.js`:

```javascript
   /* global describe, context, it */
   import {assert} from './assert.js';
   import {MyModule} from '../MyPackage/MyLibrary.js';

   describe('MyPackage/MyLibrary:MyModule', () => {
      let myInstance;

      beforeEach(() => {
         myInstance = new MyModule();
      });

      afterEach(() => {
         myInstance = undefined;
      });

      describe('.constructor()', () => {
         it('should return instance of MyModule', () => {
            assert.instanceOf(myInstance, MyModule);
         });
      });
   });
```

## The first thing
Add `saby-units` as development dependency in `package.json`:

    "devDependencies": {
        "saby-units": "git+https://github.com:saby/Units.git#rc-3.18.700"
    }

And install it:

    npm install

All files in examples below should be created in the root directory of your package.

## Run under Node.js
1. Copy file [.babelrc](.babelrc) to the root of your package.

2. Run shell command:

        node node_modules/saby-units/mocha --timeout 10000 test/**/*.test.js

so `test/**/*.test.js` is the mask to search the files with test cases.

You can save report in XML format like this:

        node node_modules/saby-units/mocha --timeout 10000 --reporter xunit --reporter-options output=artifacts/xunit-report.xml test/**/*.test.js

## Create coverage report under Node.js

1. Add to `package.json` section with setting for [nyc](https://www.npmjs.com/package/nyc) package, for example:

```javascript
  "nyc": {
    "include": [
      "Foo/**/*.js",
      "Bar/**/*.js"
    ],
    "reporter": [
      "text",
      "html"
    ],
    "extension": [
      ".es"
    ],
    "cache": false,
    "eager": true,
    "report-dir": "./artifacts/coverage"
  }
```

2. Run testing with coverage:

        node node_modules/saby-units/cover --timeout 10000 test/**/*.test.js

There are some important keys for nyc:

- `include` - mask for files to include in coverage;
- `reporter` - format of the coverage report;
- `extension` - additional files extensions to instrument;
- `report-dir` - path to folder to put the report to.

You can find out more information about fine tune at [nyc's site](https://www.npmjs.com/package/nyc).

## Run in browser
1. Add file to run local testing HTTP server with name `testing-server.js`:

```javascript
   let app = require('saby-units/server');

   app.run(
       777,//Port to run server on
       {
           root: './', //Server's document root
           tests: 'test' //Path to folder with test cases if there are placed separately (relative to 'root')
       }
   );
```

2. Run your server:

        node testing-server

3. Open your web brower and navigate to [testing page](http://localhost:777/) (you have to change the port from 777 if you've changed it at `testing-server.js`).

## Run via Selenium webdriver
1. Add file to run your test cases via webdriver `testing-browser.js`:

```javascript
   let app = require('saby-units/browser');

   app.run(
      'http://localhost:777/?reporter=XUnit',//URL of page that runs the tests via testing-server.js
      'artifacts/xunit-report.xml'//File name to save report to
   );
```

2. Run the server:

        node testing-server

3. Run testing:

        node testing-browser

# Integation with Jenkins
There are some setting you have to define

## 'Source code' section
✓ Multiple SCMs

    +GIT:

        Repository URL: git@path.to:your/module.git

        Credentials: gitread

        Branches to build: */master

        Additional Behaviours:

            +Advanced clone behaviours

                ✓ Shallow clone

## 'Environment' section
✓ Inject environment variables to the build process

There are available environment variables:

`WEBDRIVER_remote_enabled` - run on remote Selenium grid (`0` by default; change to `1` if you want to use remote selenium grid. Also you have to change host name in URL at `testing-browser.js` instead of `localhost`)

`WEBDRIVER_remote_host` - host name where Selenium grid is available (`localhost` by default)

`WEBDRIVER_remote_port` - port where Selenium grid is availbale (`4444` by default)

`WEBDRIVER_remote_desiredCapabilities_browserName` - browser name to run test cases in (`chrome` by default)

`WEBDRIVER_remote_desiredCapabilities_version` - browser version to run test cases in

✓ Abort the build if it's stuck

    Timeout minutes: 10
    Time-out actions: Abort the build

## 'Build' section
+Run shell script (to run testing under Node.js and to generate the coverage report):

    #npm config set registry http://npmregistry.sbis.ru:81/
    npm install
    node node_modules/saby-units/cover test/**/*.test.js
    node node_modules/saby-units/mocha --reporter xunit --reporter-options output=artifacts/xunit-report.xml test/**/*.test.js

+Run shell script (to run testing via webdriver)

    npm install
    node node_modules/saby-units/queue testing-server testing-browser

## 'After build operations' section
Publish JUnit test result report

    Add path to the XML report: artifacts/xunit-report.xml

    ✓ Retain long standard output/error

The path depend on settings you set in files above.

Publish documents

    Title: Coverage report

    Directory to archive: artifacts/coverage/lcov-report/

THe path depend on settings you set in `package.json`.

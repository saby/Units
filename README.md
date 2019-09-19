# Unit testing in WaSaby environment

## Introduction
It's based on [Mocha](https://mochajs.org/) and [Chai](http://chaijs.com/). [Sinon](http://sinonjs.org/) is also included.

There are some global functions which available in test cases: `describe`, `it` and many more from Mocha's [BDD interface](https://mochajs.org/#-u---ui-name).

You can include `assert` method like in [this example](assert.js).

All test cases should be named by mask `*.test.js`. For example, `test/example.test.js`:

```javascript
   /* global describe, context, it */
   import {assert} from './assert';
   import {MyModule} from '../MyPackage/MyLibrary';

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

```json
  "devDependencies": {
    "saby-units": "git+https://github.com:saby/Units.git#rc-3.19.100"
  }
````

And install it:

    npm install

All files in examples below should be created in the root directory of your package.

## Configure
Add `build` script in `scripts` section of `package.json`:

```json
  "scripts": {
    "build": "saby-units --install"
  }
````

This script creates links defined in saby-units section below.

Add `saby-units` section to your `package.json` file, for example:

```json
  "saby-units": {
    "root": "./src"
  }
```

The default config looks like:
```json
  "saby-units": {
    "moduleType": "esm",
    "root": ".",
    "tests": "",
    "report": "artifacts/xunit-report.xml",
    "htmlCoverageReport": "/artifacts/coverage/index.html",
    "jsonCoverageReport": "artifacts/coverage.json",
    "timeout": 10000,
    "links": {},
    "dependencies": [],
    "patchedRequire": false,
    "url": {
      "scheme": "http",
      "host": "localhost",
      "port": 80,
      "path": "",
      "query": "reporter=XUnit"
    }
  }
```

Parameters explanation:

- *moduleType*: type of module to test, 'esm' or 'amd';
- *root*: document root for testing files;
- *tests*: folder where tests are (if placed in separated folder);
- *report*: location of report in XUnit format which will created during testing;
- *htmlCoverageReport*: location of report in HTML format that created by nyc package;
- *jsonCoverageReport*: location of report in JSON format that created by nyc package;
- *timeout*: timeout to waiting for testing ends;
- *links*: create symbolic links to folders, a map looks like 'source folder' -> 'link'. Example:
```json
"links": {
  "node_modules/saby-types/Types": "Types"
}
```
- *dependencies*: AMD modules to load beore testing starts. Example:
```json
"dependencies": ["testing/init"]
```
- *patchedRequire*: Use patched version of [RequireJS](https://github.com/requirejs/requirejs/issues/1655);
- *url*: parts of URL of testing app to locate in browser.

You don't need to copy all the parameters to your own, you should set only changed. Preferred server port, for example.

## Run under Node.js
1. Add script to `scripts` section in your `package.json` file:

    ```json
    "test": "saby-units --isolated"
    ```

1. And run it:

        npm run test

You can save the report in XML format if you want to:

```json
"test:report": "saby-units --isolated --report"
```

## Debugging in Visual Studio Code
1. Create a new [launch configuration](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations) with [this config](./exports/launch.json).

## Create coverage report under Node.js

1. Add to `package.json` section with setting for [nyc](https://www.npmjs.com/package/nyc) package, here are recommended settings below (you just need to replace patterns in *include* section):

    ```json
      "nyc": {
        "include": [
          "Foo/**/*.js",
          "Bar/**/*.js"
        ],
        "reporter": [
          "text",
          "html"
        ],
        "cache": false,
        "eager": true,
        "report-dir": "./artifacts/coverage"
      }
    ```
 
1. Add script to `scripts` section in your `package.json` file:

    ```json
    "test:coverage": "saby-units --isolated --coverage"
    ```

1. And run it:

        npm run test:coverage

There are some important keys for nyc:

- *include*: mask for files to include in coverage;
- *reporter*: format of the coverage report;
- *report-dir*: path to folder to put the report to.

You can find out more information about fine tune at [nyc's site](https://www.npmjs.com/package/nyc).

### An important notice about symbolic links in instrumented code
If you have symbolic links in folder included for instrumentation you must mind the [unexpected *nyc* behaviour](https://stackoverflow.com/questions/53399098/enabling-nyc-istanbul-code-coverage-for-files-outside-the-package-directory) which prevent these files and folders from being instrumented. As a result you don't see desired files in coverage report. To solve this problem you should use undeclared *cwd* key which sets the default working dir for *nyc*:
   ```json
      "nyc": {
        "cwd": "./",
   ```
Also you probably have to revise *report-dir* value according to this change.

## Run via Selenium webdriver
1. Add script to `scripts` section in your `package.json` file:

    ```json
      {
         "test:browser": "saby-units --browser"
      }
    ```

1. And run it:

        npm run test:browser

## Run testing server only
You can only run the testing server and check tests in browser manually.

1. Add script to `scripts` section in your `package.json` file:

    ```json
      {
         "test:app": "saby-units --server"
      }
    ```

1. And run it:

        npm run test:app

1. Open your web brower and navigate to [testing page](http://localhost:80/) (you should change the port number if you've changed it in `package.json` file).

# Integation with Jenkins
There are some setting you have to define.
In samples below we will use out npm scripts from above.

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

`WEBDRIVER_remote_hostname` - host name where Selenium grid is available (`localhost` by default)

`WEBDRIVER_remote_port` - port where Selenium grid is availbale (`4444` by default)

`WEBDRIVER_remote_capabilities_browserName` - browser name to run test cases in (`chrome` by default)

`WEBDRIVER_remote_capabilities_version` - browser version to run test cases in

✓ Abort the build if it's stuck

    Timeout minutes: 10
    Time-out actions: Abort the build

## 'Build' section
+Run shell script (to run testing under Node.js and to generate the coverage report):

    #npm config set registry http://npmregistry.sbis.ru:81/
    npm install
    npm run test:coverage
    npm run test:report

+Run shell script (to run testing via webdriver)

    npm install
    npm run test:browser

## 'After build operations' section
Publish JUnit test result report

    Add path to the XML report: artifacts/xunit-report.xml

    ✓ Retain long standard output/error

The path depend on settings you set in files above.

Publish documents

    Title: Coverage report

    Directory to archive: artifacts/coverage/lcov-report/

The path depend on settings you set in `package.json`.

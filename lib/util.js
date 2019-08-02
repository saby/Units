/* global exports */

/**
 * Some utilites
 */

let sysfs = require('fs');
let path = require('path');

const logger = console;

/**
 * Files system extensions
 */
exports.fs = {};


/**
 * Returns unix-way path
 * @param {String} path Path to process
 * @return {String}
 */
exports.fs.unixify = function(path) {
   return String(path).split('\\').join('/');
};

/**
 * Creates folder recursive
 * @param {String} pathname Folder name
 * @param {Number} mode Folder mode
 */
exports.fs.mkdir = function(pathname, mode) {
   if (pathname && !sysfs.existsSync(pathname)) {
      exports.fs.mkdir(path.dirname(pathname), mode);
      sysfs.mkdirSync(pathname, mode);
   }
};

/**
 * Removes folder recursive
 * @param {String} path Folder name
 */
exports.fs.rmdir = function(path) {
   try {
      if (sysfs.existsSync(path)) {
         sysfs.readdirSync(path).forEach(file => {
            try {
               const curPath = path + '/' + file;
               if (sysfs.lstatSync(curPath).isDirectory()) {
                  exports.fs.rmdir(curPath);
               } else {
                  sysfs.unlinkSync(curPath);
               }
            } catch (err) {
               logger.error(err.toString());
            }
         });
         sysfs.rmdirSync(path);
      }
   } catch (err) {
      logger.error(err.toString());
   }
};

/**
 * Returns path to the NPM-module installed
 * @param {String} module Module name
 * @param {Boolean} [throws=true] Throw an error if module is not installed
 * @return {String}
 */
exports.pathTo = function(module, throws = true) {
   let paths = [
         path.join(
            path.resolve(path.join(__dirname, '..')), 'node_modules', module
         ),
         path.join(
            process.cwd(), 'node_modules', module
         )
      ],
      item,
      i;

   for (i = 0; i < paths.length; i++) {
      item = paths[i];
      try {
         if (sysfs.accessSync) {
            sysfs.accessSync(item);
         } else {
            if (!sysfs.existsSync(item)) {
               throw new Error('Path "' + item + '" does exist');
            }
         }
      } catch (err) {
         continue;
      }
      return item;
   }

   if (throws) {
      throw new ReferenceError('Path to node module "' + module + '" is not found.');
   }
};

/**
 * Returns actual config
 * @return {Object}
 */
exports.getConfig = function() {
   const defaults = require('../package.json').config;
   let current = require(path.join(process.cwd(), 'package.json'))['saby-units'] || {};
   if (process.argv.length > 1) {
      let configArgv = process.argv.filter((item) => item.includes('--config'));
      if (configArgv.length > 0) {
         let configPath = configArgv[0].split('=')[1];
         current = require(path.join(process.cwd(), configPath));
      }
   }
   let config = Object.assign({}, defaults, current);
   config.url = Object.assign({}, defaults.url, config.url);
   config.tests = typeof(config.tests) === 'string' ? [config.tests] : config.tests;

   return config;
};

/**
 * Replaces configuration values from the same environment variables
 * @param {Object} config Configuration
 * @param {String} prefix Environment variables prefix
 */
exports.fromEnv = function(config, prefix) {
   prefix = prefix ? prefix + '_' : '';

   let value;
   for (let key in config) {
      if (config.hasOwnProperty(key)) {
         if (typeof config[key] === 'object') {
            exports.fromEnv(config[key], prefix + key);
         } else {
            let envKey = prefix + key;
            if (process.env[envKey] !== undefined) {
               value = process.env[envKey];
               if (typeof config[key] === 'boolean') {
                  value = Number(value) !== 0;
               }
               config[key] = value;
            }
         }
      }
   }
};

/**
 * Parses arguments looks like key=value
 * @param {Object.<String>} defaults Default values
 * @return {Object.<String>}
 */
exports.parseArgv = function(defaults) {
   let argv = process.argv,
      result = defaults || {},
      i,
      key,
      val;
   for (i = 1; i < argv.length; i++) {
      val = argv[i].split('=');
      if (val.length > 1) {
         key = val.shift();
         val = val.join('=');
         if (key) {
            result[key] = val;
         }
      }
   }
   return result;
};

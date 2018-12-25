#!/usr/bin/env node
const fs = require('fs');
const util = require('../lib/util');
const config = util.getConfig();

if (config.links) {
   const map = config.links;
   const logger = console;
   Object.keys(map).forEach((source) => {
      let target = map[source];

      try {
         fs.symlinkSync(source, target, 'dir');
         logger.log(`Create symlink from '${source}' to '${target}': success`);
      } catch (err) {
         logger.warn(`Create symlink from '${source}' to '${target}': fail`);
         logger.warn(err.message);
      }
   });
}
